// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let progressStatusBarItem: vscode.StatusBarItem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "someext" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('someext.DoSmth', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('I work!');
	});
	context.subscriptions.push(disposable);

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	progressStatusBarItem.command = 'someext.DoSmth';
	context.subscriptions.push(progressStatusBarItem);

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));

	updateStatusBar();
}

// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	let close = vscode.commands.registerCommand('someext.CloseIt', () => {
		vscode.window.showInformationMessage('I closes(');
		progressStatusBarItem.hide();
	});

	context.subscriptions.push(close);
}

function updateStatusBar() : void {
	const n = getNumberOfLines(vscode.window.activeTextEditor);
	const todoes = getTODOes(vscode.window.activeTextEditor);

	if (n > 0) {
		progressStatusBarItem.text = `Here is lines = ${n}`;
		progressStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		progressStatusBarItem.show();
		console.log("show status bar");
	}
	else {
		progressStatusBarItem.hide();
		console.log("hide status bar");
	}

	if (todoes.length > 0) {
		vscode.window.showInformationMessage(`You have todes at:\n ${todoes} lines`);
		console.log("show status bar");
	}
}
function getNumberOfLines(editor : vscode.TextEditor | undefined) : number {
	const text = editor?.document.getText();

	var textLines = text?.split('\n')
	let lines = 0
	textLines?.forEach((value:string) => {
		let match = value.match('.+')?.length;
		lines += match == undefined? 0: match;
		console.log(`match is ${match}`);
	});
	console.log(`get number of lines ${lines}`);

	return lines == undefined? 0:lines;
}

function getTODOes(editor : vscode.TextEditor | undefined): Array<string> | Array<undefined> {
	let array:Array<string> = [];
	const text = editor?.document.getText();
	var textLines = text?.split('\n')

	let ind = 1
	textLines?.forEach((value:string) => {
		let includes = value.toLocaleLowerCase().replace(' ','').includes('todo');
		if (includes) {
			array.push(ind.toString());
		}
		ind += 1;
	});
	return array;
}
