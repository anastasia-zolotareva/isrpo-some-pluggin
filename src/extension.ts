// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {getNumberOfLines} from './getNumberOfLines';

let progressStatusBarItem: vscode.StatusBarItem;

let docsStatuses: {"name":string, "lines":number}[];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "someext" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let doSmthCommand = vscode.commands.registerCommand('someext.DoSmth', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('I work!');
	});

	context.subscriptions.push(doSmthCommand);

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
	progressStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
	progressStatusBarItem.command = 'someext.DoSmth';
	context.subscriptions.push(progressStatusBarItem);
	
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(updateStatusBar));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(updateLines));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(updateStatusBar));

	updateLines();
	updateStatusBar();
}

// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	let close = vscode.commands.registerCommand('someext.CloseIt', () => {

		vscode.workspace.saveAll()
		vscode.window.showInformationMessage('I closes(');
		progressStatusBarItem.hide();
	});

	context.subscriptions.push(close);
}

function createStatusBarItemMessageLines(lines: number): string {
	let message = "";
	if (lines < 0) {
		vscode.window.showInformationMessage('Looks like you are on regression or some refactoring..');
	}
	message = `New lines: ${lines}`;
	return message;
}
function updateLines() : void {
	let docs = vscode.workspace.textDocuments;
	docsStatuses = []
	docs.forEach((doc) => {
		let name = doc.fileName
		let lines = getNumberOfLines(doc.getText());
		docsStatuses.push({"name": name, "lines": lines});

		console.log(`name: ${name}, lines: ${lines}`);
	})
}

function updateStatusBar() : void {
	let docs = vscode.workspace.textDocuments;
	let newLines = 0
	docs.forEach((doc) => {
		let name = doc.fileName
		let lines = getNumberOfLines(doc.getText());
		let ind = docsStatuses.findIndex(i => i.name == name);
		if (docsStatuses[ind]?.lines != lines) {
			let l = docsStatuses[ind]?.lines
			newLines += lines - (l !=undefined? l: 0);
			console.log(`in doc ${name} with l ${l} added ${newLines} lines`);
			if (l) {
				docsStatuses[ind].lines = lines;
			}
		}
	});

	if (newLines != 0) {
		let textLines = createStatusBarItemMessageLines(newLines);
		progressStatusBarItem.text = textLines;
		progressStatusBarItem.show();
		console.log("show status bar");
	}
	else {
		progressStatusBarItem.text = `No lines`;
		progressStatusBarItem.show();
	}
}
