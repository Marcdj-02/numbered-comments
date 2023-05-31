"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainTree = void 0;
const vscode = require("vscode");
const Tree_1 = require("./Tree");
class ChainTree {
    constructor(id, description, line) {
        this.id = id;
        this.description = description;
        this.line = line;
        this.id = id;
        this.description = description;
        this.line = line;
        this.children = [];
    }
    addChild(id, description, line) {
        const newNode = new ChainTree(id, description, line);
        newNode.parent = this;
        this.children.push(newNode);
        return newNode;
    }
    findOrCreateChild(id, description, line) {
        const existingChild = this.children.find(child => child.id === id);
        if (existingChild)
            return existingChild;
        return this.addChild(id, description, line);
    }
    getParentChain() {
        const chain = [];
        let currentNode = this;
        while (currentNode && !Number.isNaN(currentNode.id)) {
            chain.unshift(currentNode.id);
            currentNode = currentNode.parent;
        }
        return chain;
    }
    toTree() {
        const collapsibleState = this.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
        const tree = new Tree_1.Tree(this.getParentChain(), this.description, this.line, this.parent ? collapsibleState : vscode.TreeItemCollapsibleState.Expanded);
        tree.children = this.children.map(child => child.toTree());
        return tree;
    }
}
exports.ChainTree = ChainTree;
//# sourceMappingURL=ChainTree.js.map