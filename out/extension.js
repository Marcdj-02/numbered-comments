"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
function activate(context) {
    const commentDiagnostics = vscode.languages.createDiagnosticCollection("numbered-comments");
    context.subscriptions.push(commentDiagnostics);
    (0, diagnostics_1.subscribeToDocumentChanges)(context, commentDiagnostics);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map