"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
const commentTreeProvider_1 = require("./commentTreeProvider");
const TARGET_LANGUAGES = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'python', 'csharp', 'java', 'sql'];
const COMMAND_COMPLETIONS = [["// @", "@", "nc-ignore"], ["// @", "@", "nc-reset"]];
function activate(context) {
    for (const language of TARGET_LANGUAGES) {
        for (const commandCompletion of COMMAND_COMPLETIONS) {
            context.subscriptions.push(vscode.languages.registerCompletionItemProvider(language, {
                provideCompletionItems(document, position) {
                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                    if (!linePrefix.endsWith(commandCompletion[0])) {
                        return undefined;
                    }
                    const item = new vscode.CompletionItem(commandCompletion[2], vscode.CompletionItemKind.Snippet);
                    return [item];
                }
            }, commandCompletion[1]));
        }
    }
    const commentTreeProvider = new commentTreeProvider_1.CommentTreeProvider();
    vscode.window.registerTreeDataProvider('comment-tree', commentTreeProvider);
    // Register the command to highlight a line in the current editor
    vscode.commands.registerCommand('comment-tree.goToLine', (lineNumber) => {
        let editor = vscode.window.activeTextEditor;
        if (!editor || lineNumber === undefined)
            return;
        let range = editor.document.lineAt(lineNumber).range;
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range);
    });
    const commentDiagnostics = vscode.languages.createDiagnosticCollection("numbered-comments");
    context.subscriptions.push(commentDiagnostics);
    (0, diagnostics_1.subscribeToDocumentChanges)(context, commentDiagnostics);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map