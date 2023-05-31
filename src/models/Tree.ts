import * as vscode from 'vscode';
import { Chain, chainToString } from '../diagnostics';

export class Tree extends vscode.TreeItem {
    constructor(
        public readonly chain: Chain,
        public readonly description: string,
        public readonly line: number | undefined,
		public collapsibleState: vscode.TreeItemCollapsibleState,
        public children: Tree[] = [],
	) {
        const label = chainToString(chain);
		super(label, collapsibleState);

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