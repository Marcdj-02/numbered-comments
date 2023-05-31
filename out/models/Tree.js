"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("../diagnostics");
class Tree extends vscode.TreeItem {
    constructor(chain, description, line, collapsibleState, children = []) {
        const label = (0, diagnostics_1.chainToString)(chain);
        super(label, collapsibleState);
        this.chain = chain;
        this.description = description;
        this.line = line;
        this.collapsibleState = collapsibleState;
        this.children = children;
        this.tooltip = description;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.children = [];
        // If the tree item is clicked, highlight the line in the current editor
        this.command = {
            command: 'comment-tree.goToLine',
            title: 'Go to Line',
            arguments: [line]
        };
    }
    getChildren() {
        return this.children;
    }
}
exports.Tree = Tree;
//# sourceMappingURL=Tree.js.map