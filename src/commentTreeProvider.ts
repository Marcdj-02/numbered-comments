import * as vscode from 'vscode';
import { Tree } from './models/Tree';
import { IGNORE_FILE_REGEX, RESET_COUNTER_REGEX, chainIsChildOfOther, chainSucceedsOther, chainToString, lineToChain, lineToChainRemainder } from './diagnostics';
import { ChainTree } from './models/ChainTree';

function documentToTrees(document: vscode.TextDocument | undefined): Tree[] { 
	const chainTrees: ChainTree[] = [new ChainTree(Number.NaN, '--- Comment section 1 ---', undefined)];

	if (!document) return [];

	for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
		const line = document.lineAt(lineIndex);

		if (IGNORE_FILE_REGEX.test(line.text)) {
            return chainTrees.map(tree => tree.toTree());
        }

        if (RESET_COUNTER_REGEX.test(line.text)) {
            chainTrees.push(new ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
            continue;
        }

		const chain = lineToChain(line.text)
		if (!chain) continue;

		const description = lineToChainRemainder(line.text);

		const currentChainTree = chainTrees[chainTrees.length - 1];
		const currentHead = currentChainTree.children[currentChainTree.children.length - 1];

		if (currentHead && chain[0] === 0 && currentHead.id > 0){
			chainTrees.push(new ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
		}
		else if (currentHead && chain[0] === 1 && currentHead.id > 1) {
			chainTrees.push(new ChainTree(Number.NaN, `--- Comment section ${chainTrees.length + 1} ---`, undefined));
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

	return chainTrees.map(tree => tree.toTree());
}
export class CommentTreeProvider implements vscode.TreeDataProvider<Tree> {

	private _onDidChangeTreeData: vscode.EventEmitter<Tree | undefined | void> = new vscode.EventEmitter<Tree | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Tree | undefined | void> = this._onDidChangeTreeData.event;

	private topLevelComments: Tree[] = [];

	constructor() {
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
        }
        );
    }

    private onDocumentChange(document: vscode.TextDocument | undefined): void {
        // const content = document?.getText() ?? 'undefined';
		this.topLevelComments = documentToTrees(document);
		this._onDidChangeTreeData.fire();
    }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Tree): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Tree): Thenable<Tree[]> {
		if (!this.topLevelComments) {
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(element.getChildren() ?? []);
		}

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

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	// private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
	// 	const workspaceRoot = this.workspaceRoot;
	// 	if (this.pathExists(packageJsonPath) && workspaceRoot) {
	// 		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

	// 		const toDep = (moduleName: string, version: string): Dependency => {
	// 			if (this.pathExists(path.join(workspaceRoot, 'node_modules', moduleName))) {
	// 				return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
	// 			} else {
	// 				return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
	// 					command: 'extension.openPackageOnNpm',
	// 					title: '',
	// 					arguments: [moduleName]
	// 				});
	// 			}
	// 		};

	// 		const deps = packageJson.dependencies
	// 			? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
	// 			: [];
	// 		const devDeps = packageJson.devDependencies
	// 			? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
	// 			: [];
	// 		return deps.concat(devDeps);
	// 	} else {
	// 		return [];
	// 	}
	// }

	// private pathExists(p: string): boolean {
	// 	try {
	// 		fs.accessSync(p);
	// 	} catch (err) {
	// 		return false;
	// 	}

	// 	return true;
	// }
}

export class Dependency extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}`;
		this.description = undefined;
	}

	iconPath = {
		light: '../../assets/favicon.png',
		dark: '../../assets/favicon.png'
	};

	contextValue = 'dependency';
}