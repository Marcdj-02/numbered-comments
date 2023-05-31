"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
const commentTreeProvider_1 = require("./commentTreeProvider");
function activate(context) {
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