import * as vscode from 'vscode';

export const NUMBERED_COMMENTS = 'numbered_comments';

// 1. General regex matching rules
const COMMENT_SYMBOLS_REGEX = [/\/\//, /\/\*/, /#/, /--/];
const CHAIN_REGEX = /\d+\.(?:\d\.?)*/;
const NUMBERED_COMMENT_REGEX = new RegExp(`^ *(?:${COMMENT_SYMBOLS_REGEX.map((e) => e.source).join("|")}) (${CHAIN_REGEX.source})`)
const CHAIN_DELIMITER = ".";

// 2. Extension command matching rules
export const IGNORE_FILE_REGEX = new RegExp(`^ *(?:${COMMENT_SYMBOLS_REGEX.map((e) => e.source).join("|")}) *@nc-ignore`);
export const RESET_COUNTER_REGEX = new RegExp(`^ *(?:${COMMENT_SYMBOLS_REGEX.map((e) => e.source).join("|")}) *@nc-reset`);

// 3. Type facade for number chains
export type Chain = number[];

/**
 * Remove any preceding whitespace and comment symbols from the line.
 * 
 * @param line - line to remove comment symbols and whitespace from
 * @returns line without comment symbols and whitespace
 * 
 * @example removeCommentSymbolAndWhitespace("// 1. test") -> [1]
 * @example removeCommentSymbolAndWhitespace("/* 1.2 test") -> [1,2]
 * 
 * @author Marc de Jong
 * @date 2023-05-23
 */
export function lineToChain(line: string): Chain | null {
    // 1. Remove preceding whitespace
    const lineWithoutWhitespace = line.trimStart();

    // 2. Remove preceding comment symbols
    const lineWithoutCommentSymbols = (() => {
        for (const regex of COMMENT_SYMBOLS_REGEX) {
            if (new RegExp("^" + regex.source).test(lineWithoutWhitespace)) {
                return lineWithoutWhitespace.replace(new RegExp("^" + regex.source), "");
            }
        }

        return lineWithoutWhitespace;
    })();

    // 3. Remove any whitespace after comment symbols
    const lineWithoutCommentSymbolsAndWhitespace = lineWithoutCommentSymbols.trimStart();

    // 4. Find the number chain
    const chain = lineWithoutCommentSymbolsAndWhitespace.match(new RegExp(`^${CHAIN_REGEX.source}`));

    // 5. If there is no chain, return null
    if (!chain) {
        return null;
    }

    // 6. Split the chain on the delimiter and parse the numbers
    const numberChain = chain[0].split(CHAIN_DELIMITER).map((val) => parseInt(val));

    // 7. Return the chain
    return numberChain.filter((numb) => !isNaN(numb));

}

/**
 * Remove any preceding whitespace and comment symbols from the line.
 * @author Marc de Jong
 * @date 2023-05-23
 */
export function lineToChainRemainder(line: string): string {
    // 1. Remove leading whitespace
    const lineWithoutWhitespace = line.trimStart();

    // 2. Remove leading comment symbols
    const lineWithoutCommentSymbols = (() => {
        if (NUMBERED_COMMENT_REGEX.test(lineWithoutWhitespace)) {
            return lineWithoutWhitespace.replace(NUMBERED_COMMENT_REGEX, "");
        }

        return lineWithoutWhitespace;
    })();

    // 3. Remove any whitespace after comment symbols
    const lineWithoutCommentSymbolsAndWhitespace = lineWithoutCommentSymbols.trimStart();

    // 4. Strip the chain from the comment
    const remainder = lineWithoutCommentSymbolsAndWhitespace.replace(new RegExp(`^ ${CHAIN_REGEX.source}`), "");

    // 5. Return the remainder
    return remainder.trim();
}

/**
 * Compares two arrays for equality by comparing each element.
 * 
 * @param a - first array
 * @param b - second array
 * @returns true if the arrays are equal, false otherwise
 * 
 * @author Marc de Jong
 * @date 2023-05-24
 */
function arraysAreEqual(a: number[], b: number[]) {
    // 1. If the arrays are not of equal length, they cannot be equal
    if (a.length !== b.length) {
        return false;
    }

    // 2. Compare each element
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    // 3. If all elements are equal, the arrays are equal
    return true;
}

/**
 * Convert a chain to a string
 * 
 * @param chain - The chain to convert
 * @returns The stringified chain
 * 
 * @author Marc de Jong
 * @date 2023-05-24
 */
export function chainToString(chain: Chain) {
    return chain.join(CHAIN_DELIMITER);
}

/**
 * Function to determine whether two chains succeed each other.
 * 
 * The current chain can proceed the previous chain in two ways:
 * 1. Increase on value in the previous chain and trim the rest
 * 2. Append the value of 1 to the old chain
 * 
 * @example chainSucceedsOther([1], [2]) -> true
 * @example chainSucceedsOther([1,1], [1,2]) -> true
 * @example chainSucceedsOther([1,1,1], [1,2]) -> false
 * 
 * @param prev 
 * @param current 
 * 
 *
 * @author Marc de Jong
 * @date 2023-05-24
 */
export function chainSucceedsOther(prev: Chain, current: Chain){
    // 1. Check the case in which the previous chain is appended by a one
    if (arraysAreEqual(current, [...prev, 1])){
        return true;
    }

    // 2. Check the case in which the previous chain is increased by one and cut off
    for (let i = 0; i < prev.length; ++i) {
        // 2.1 Check if the current position is the same as the previous position + 1, and is the last of the chain
        if (prev[i] + 1 === current[i] && i === current.length - 1) {
            return true;
        }

        // 2.2 If previous condition was not met, check if the positions are the same, otherwise the chain does not succeed
        if (prev[i] !== current[i]){
            return false;
        }
    }

    // 3. If neither case is true, the current chain does not succeed the previous chain
    return false;
}

export function refreshDiagnostics(doc: vscode.TextDocument, commentDiagnostics: vscode.DiagnosticCollection): void {
	const diagnostics: vscode.Diagnostic[] = [];
    let lastChain: Chain | null = null;

    // 1. Iterate over all lines in the document
	for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
		const line = doc.lineAt(lineIndex);

        // 1.1 If an ignore comment is found, stop processing the file
        if (IGNORE_FILE_REGEX.test(line.text)) {
            break;
        }

        // 1.2 If a reset counter comment is found, empty the last chain and start over
        if (RESET_COUNTER_REGEX.test(line.text)) {
            lastChain = null;
            continue;
        }

        // 1.3 If a comment is found, try to parse the chain
        const chain = lineToChain(line.text);
        
        // 1.4 If no chain is found, go to the next line
        if (!chain) {
            continue;
        }

        // 1.5 If the chain starts with a 0 or 1 and does not start the same as the previous chain, we reset the chain
        if (lastChain && chain[0] < 2 && chain[0] !== lastChain[0]) {
            lastChain = chain;
            continue;
        }

        // 1.6 If the chain does not succeed the previous chain, create a diagnostic to warn the user
        if (lastChain && !chainSucceedsOther(lastChain, chain)) {
            diagnostics.push(createDiagnostic(doc, line, lineIndex, lastChain));
        }

        // 1.7 Set the last chain to the current chain
        lastChain = chain;
	}

    // 2. Set the diagnostics to expose the errors
	commentDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number, lastChain: Chain): vscode.Diagnostic {
    // 1. Find the match
    const match = lineOfText.text.match(NUMBERED_COMMENT_REGEX);

    // 2. If no match is found, throw an error
    if(!match) {
        throw new Error("No match found");
    }

    // 3. Get the capture groups from the match
    const matchedSubString = match[0];
    const capturedChain = match[1];

    // 4. If no capture group is found, throw an error
    if (!matchedSubString || !capturedChain) {
        throw new Error("No matchZero found");
    }

    // 5. Get the start of the captured chain
    const index = matchedSubString.indexOf(capturedChain);

    // 6. Create a range for the diagnostic to indicate the error
	const range = new vscode.Range(lineIndex, index, lineIndex, index + capturedChain.length);

    // 7. Remove the trailing dot from the captured chain
    const captureGroupWithoutTrailingDot = capturedChain[capturedChain.length - 1] === "." ? capturedChain.slice(0, -1) : capturedChain;

    // 8. Create a diagnostic to indicate the error 
	const diagnostic = new vscode.Diagnostic(range, `Comment number (${captureGroupWithoutTrailingDot}) does not succeed previous comment number (${chainToString(lastChain)})`,
		vscode.DiagnosticSeverity.Warning);
	diagnostic.code = NUMBERED_COMMENTS;

    // 9. Return the diagnostic
	return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, commentDiagnostics: vscode.DiagnosticCollection): void {
	if (vscode.window.activeTextEditor) {
		refreshDiagnostics(vscode.window.activeTextEditor.document, commentDiagnostics);
	}
    
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshDiagnostics(editor.document, commentDiagnostics);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, commentDiagnostics))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => commentDiagnostics.delete(doc.uri))
	);

}