/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { subscribeToDocumentChanges } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
	const commentDiagnostics = vscode.languages.createDiagnosticCollection("numbered-comments");
	context.subscriptions.push(commentDiagnostics);

	subscribeToDocumentChanges(context, commentDiagnostics);
}