"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentTreeProvider = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
const ChainTree_1 = require("./models/ChainTree");
function documentToTrees(document) {
    const chainTrees = [new ChainTree_1.ChainTree(Number.NaN, '--- Comment section 1 ---', undefined)];
    // 1. If there is no current document, return an empty array
    if (!document)
        return [];
    // 2. Iterate over all lines in the document
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        // 2.1 If an ignore comment is found, stop processing the file
        if (diagnostics_1.IGNORE_FILE_REGEX.test(line.text)) {
            return chainTrees.map(tree => tree.toTree());
        }
        // 2.2 If a reset counter comment is found, empty the last chain and start over
        if (diagnostics_1.RESET_COUNTER_REGEX.test(line.text)) {
            chainTrees.push(new ChainTree_1.ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
            continue;
        }
        // 2.3 If a comment is found, try to parse the chain
        const chain = (0, diagnostics_1.lineToChain)(line.text);
        // 2.4 If no chain is found, go to the next line
        if (!chain)
            continue;
        // 2.5 Get the comment's description from the comment
        const description = (0, diagnostics_1.lineToChainRemainder)(line.text);
        // 2.6 Get the current chain tree and head
        const currentChainTree = chainTrees[chainTrees.length - 1];
        const currentHead = currentChainTree.children[currentChainTree.children.length - 1];
        // 2.7 If the chain starts with a 0 and the current head does not start with a 0, create a new chain tree
        if (currentHead && chain[0] === 0 && currentHead.id > 0) {
            chainTrees.push(new ChainTree_1.ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
        }
        // 2.8 If the chain starts with a 1 and the current head does not start with a 1, create a new chain tree
        else if (currentHead && chain[0] === 1 && currentHead.id > 1) {
            chainTrees.push(new ChainTree_1.ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
        }
        let chainIndex = 0;
        let treeNode = chainTrees[chainTrees.length - 1];
        // 2.9 Iterate over the chain and create the tree nodes
        while (chainIndex < chain.length) {
            // 2.9.1 The desciption is only added to the last node in the chain
            const nodeDescription = chainIndex === chain.length - 1 ? description : '';
            // 2.9.2 The line is only added to the last node in the chain
            const nodeLine = chainIndex === chain.length - 1 ? lineIndex : undefined;
            // 2.9.3 Find or create the child node
            treeNode = treeNode.findOrCreateChild(chain[chainIndex], nodeDescription, nodeLine);
            // 2.9.4 Go to the next node in the chain
            chainIndex++;
        }
    }
    // 3. Return the trees
    return chainTrees.map(tree => tree.toTree());
}
class CommentTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.topLevelComments = [];
        // Get the active text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        // Get the document
        let doc = editor.document;
        // Get all the text in the document
        this.onDocumentChange(doc);
        // Listen to document changes
        vscode.workspace.onDidChangeTextDocument(event => {
            this.onDocumentChange(event.document);
        });
        // Listen if the user switched to a different document
        vscode.window.onDidChangeActiveTextEditor(editor => {
            this.onDocumentChange(editor?.document);
        });
    }
    onDocumentChange(document) {
        // const content = document?.getText() ?? 'undefined';
        this.topLevelComments = documentToTrees(document);
        this._onDidChangeTreeData.fire();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.topLevelComments) {
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve(element.getChildren() ?? []);
        }
        return Promise.resolve(this.topLevelComments);
    }
}
exports.CommentTreeProvider = CommentTreeProvider;
//# sourceMappingURL=commentTreeProvider.js.map