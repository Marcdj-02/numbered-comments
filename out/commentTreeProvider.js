"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.CommentTreeProvider = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
const ChainTree_1 = require("./models/ChainTree");
function documentToTrees(document) {
    const chainTrees = [new ChainTree_1.ChainTree(Number.NaN, '--- Comment section 1 ---', undefined)];
    if (!document)
        return [];
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        const chain = (0, diagnostics_1.lineToChain)(line.text);
        if (!chain)
            continue;
        const description = (0, diagnostics_1.lineToChainRemainder)(line.text);
        const currentChainTree = chainTrees[chainTrees.length - 1];
        const currentHead = currentChainTree.children[currentChainTree.children.length - 1];
        if (currentHead && chain[0] === 0 && currentHead.id > 0) {
            chainTrees.push(new ChainTree_1.ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
        }
        else if (currentHead && chain[0] === 1 && currentHead.id > 1) {
            chainTrees.push(new ChainTree_1.ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
        }
        let chainIndex = 0;
        let treeNode = chainTrees[chainTrees.length - 1];
        while (chainIndex < chain.length) {
            const nodeDescription = chainIndex === chain.length - 1 ? description : '';
            const nodeLine = chainIndex === chain.length - 1 ? lineIndex : undefined;
            treeNode = treeNode.findOrCreateChild(chain[chainIndex], nodeDescription, nodeLine);
            chainIndex++;
        }
    }
    console.log(chainTrees);
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
        console.log('resolving alrgiht', this.topLevelComments);
        return Promise.resolve(this.topLevelComments);
        // if (element) {
        // 	return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        // } else {
        // 	const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        // 	if (this.pathExists(packageJsonPath)) {
        // 		return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        // 	} else {
        // 		vscode.window.showInformationMessage('Workspace has no package.json');
        // 		return Promise.resolve([]);
        // 	}
        // }
    }
}
exports.CommentTreeProvider = CommentTreeProvider;
class Dependency extends vscode.TreeItem {
    constructor(label, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = {
            light: '../../assets/favicon.png',
            dark: '../../assets/favicon.png'
        };
        this.contextValue = 'dependency';
        this.tooltip = `${this.label}`;
        this.description = undefined;
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=commentTreeProvider.js.map