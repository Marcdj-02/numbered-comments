import * as vscode from 'vscode';
import { Chain } from '../diagnostics';
import { Tree } from './Tree';

export class ChainTree {
    public children: ChainTree[];
    public parent: ChainTree | undefined;

    constructor(
        public readonly id: number,
        public readonly description: string,
        public readonly line: number | undefined,
	) {
        this.id = id;
        this.description = description;
        this.line = line;
        this.children = [];
	}

    addChild(id: number, description: string, line: number | undefined) {
        const newNode = new ChainTree(id, description, line);
        newNode.parent = this;
        this.children.push(newNode);
        return newNode;
    }

    findOrCreateChild(id: number, description: string, line: number | undefined) {
        const existingChild = this.children.find(child => child.id === id);
        if (existingChild) return existingChild;
        return this.addChild(id, description, line);
    }

    getParentChain(): Chain {
        const chain: Chain = [];
        let currentNode: ChainTree | undefined = this;
        while (currentNode && !Number.isNaN(currentNode.id)) {
            chain.unshift(currentNode.id);
            currentNode = currentNode.parent;
        }
        return chain;
    }

    toTree(): Tree {
        const collapsibleState = this.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
        const tree = new Tree(this.getParentChain(), this.description, this.line, this.parent ? collapsibleState : vscode.TreeItemCollapsibleState.Expanded);
        tree.children = this.children.map(child => child.toTree());
        return tree;
    }
}