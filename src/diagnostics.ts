import * as vscode from 'vscode';

export const NUMBERED_COMMENTS = 'numbered_comments';

const START_COMMENT_SYMBOLS_REGEX = [/^\/\//, /^\/\*/];
const NUMBERED_COMMENT_REGEX = /^ *(?:\/\/|\/\*|#) (\d+\.(?:\d\.?)*)/;
const CHAIN_REGEX = /^\d+\.(?:\d\.?)*/;
const CHAIN_DELIMITER = ".";

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
    const lineWithoutWhitespace = line.trimStart();
    const lineWithoutCommentSymbols = (() => {
        for (const regex of START_COMMENT_SYMBOLS_REGEX) {
            if (regex.test(lineWithoutWhitespace)) {
                return lineWithoutWhitespace.replace(regex, "");
            }
        }

        return lineWithoutWhitespace;
    })();

    const lineWithoutCommentSymbolsAndWhitespace = lineWithoutCommentSymbols.trimStart();

    const chain = lineWithoutCommentSymbolsAndWhitespace.match(CHAIN_REGEX);

    if (!chain) {
        return null;
    }

    const numberChain = chain[0].split(CHAIN_DELIMITER).map((val) => parseInt(val));

    return numberChain.filter((numb) => !isNaN(numb));

}

/**
 * Remove any preceding whitespace and comment symbols from the line.
 * @author Marc de Jong
 * @date 2023-05-23
 */
export function lineToChainRemainder(line: string): string {
    const lineWithoutWhitespace = line.trimStart();
    const lineWithoutCommentSymbols = (() => {
        for (const regex of START_COMMENT_SYMBOLS_REGEX) {
            if (regex.test(lineWithoutWhitespace)) {
                return lineWithoutWhitespace.replace(regex, "");
            }
        }

        return lineWithoutWhitespace;
    })();

    const lineWithoutCommentSymbolsAndWhitespace = lineWithoutCommentSymbols.trimStart();

    const remainder = lineWithoutCommentSymbolsAndWhitespace.replace(CHAIN_REGEX, "");

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
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

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
    // Check the case in which the previous chain is appended by a one
    if (arraysAreEqual(current, [...prev, 1])){
        return true;
    }

    // Check the case in which the previous chain is increased by one and cut off
    for (let i = 0; i < prev.length; ++i) {
        if (prev[i] + 1 === current[i] && i === current.length - 1) {
            return true;
        }
    }

    return false;
}

/**
 * 
 * @example chainIsChildOfOther([1], [2]) -> false
 * @example chainIsChildOfOther([1,1], [1,2]) -> false
 * @example chainIsChildOfOther([1,1,1], [1,2]) -> false
 * @example chainIsChildOfOther([1], [1,1]) -> true
 * @example chainIsChildOfOther([1,1], [1,1,1]) -> true
 * @example chainIsChildOfOther([1,1,1], [1,1,1,1]) -> true
*/
export function chainIsChildOfOther(parent: Chain| string, child: Chain) {
    if (typeof parent === 'string') return true;
    if (parent.length >= child.length) {
        return false;
    }

    for (let i = 0; i < parent.length; ++i) {
        if (parent[i] !== child[i]) {
            return false;
        }
    }

    return false;
}

export function refreshDiagnostics(doc: vscode.TextDocument, commentDiagnostics: vscode.DiagnosticCollection): void {
	const diagnostics: vscode.Diagnostic[] = [];
    let lastChain: Chain | null = null;

	for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
		const line = doc.lineAt(lineIndex);
        const chain = lineToChain(line.text);
        
        if (!chain) {
            continue;
        }

        if (lastChain && chain[0] < 2 && chain[0] !== lastChain[0]) {
            lastChain = chain;
            continue;
        }

        if (lastChain && !chainSucceedsOther(lastChain, chain)) {
            diagnostics.push(createDiagnostic(doc, line, lineIndex, lastChain));
        }

        lastChain = chain;
	}

	commentDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number, lastChain: Chain): vscode.Diagnostic {
    const match = lineOfText.text.match(NUMBERED_COMMENT_REGEX);

    if(!match) {
        throw new Error("No match found");
    }

    const matchedSubString = match[0];
    const captureGroup = match[1];

    if (!matchedSubString || !captureGroup) {
        throw new Error("No matchZero found");
    }

    const index = matchedSubString.indexOf(captureGroup);

	const range = new vscode.Range(lineIndex, index, lineIndex, index + captureGroup.length);

    const captureGroupWithoutTrailingDot = captureGroup[captureGroup.length - 1] === "." ? captureGroup.slice(0, -1) : captureGroup;

	const diagnostic = new vscode.Diagnostic(range, `Comment number (${captureGroupWithoutTrailingDot}) does not succeed previous comment number (${chainToString(lastChain)})`,
		vscode.DiagnosticSeverity.Warning);
	diagnostic.code = NUMBERED_COMMENTS;
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