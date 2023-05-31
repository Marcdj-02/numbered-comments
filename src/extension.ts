/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { subscribeToDocumentChanges } from './diagnostics';
import { CommentTreeProvider } from './commentTreeProvider';

export function activate(context: vscode.ExtensionContext) {
	const commentTreeProvider = new CommentTreeProvider();
	vscode.window.registerTreeDataProvider('comment-tree', commentTreeProvider);

	// Register the command to highlight a line in the current editor
	vscode.commands.registerCommand('comment-tree.goToLine', (lineNumber: number | undefined) => {
		let editor = vscode.window.activeTextEditor;
		if(!editor || lineNumber === undefined) return;
		let range = editor.document.lineAt(lineNumber).range;
		editor.selection = new vscode.Selection(range.start, range.end);
		editor.revealRange(range);
	});
	
	const commentDiagnostics = vscode.languages.createDiagnosticCollection("numbered-comments");
	context.subscriptions.push(commentDiagnostics);

	subscribeToDocumentChanges(context, commentDiagnostics);
}