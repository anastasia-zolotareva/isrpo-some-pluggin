// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { TextEncoder } from 'util';
import * as vscode from 'vscode';
import {dataStructure, filesDataStucture} from './interfaces';
import {getFiles, getLinesForFiles} from './filesAnalyze';

let progressStatusBarItem: vscode.StatusBarItem;

let docsStatusesPerTime: dataStructure;

let maxMinutes = 5;

let curTime: Date;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let doSmthCommand = vscode.commands.registerCommand('someext.DoSmth', () => {
		vscode.window.showInformationMessage('I work!');
	});

	context.subscriptions.push(doSmthCommand);

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
	progressStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
	progressStatusBarItem.command = 'someext.DoSmth';
	context.subscriptions.push(progressStatusBarItem);
	console.log("new status bar created");

	// read progress file or create new, defind docsStatusesPerTime
	if (vscode.workspace.workspaceFolders !== undefined) {
		const uri  = vscode.workspace.workspaceFolders[0].uri;
		const projectName = uri.path;
		var progressFileUri = await getFiles('progress.json', null);
		if (progressFileUri == undefined || progressFileUri[0] == undefined) {
			console.log("no progress file");
			var date = new Date();
			docsStatusesPerTime = {"updateTime": date, "projectName":projectName};
			console.log(docsStatusesPerTime);
			console.log("docsStatusesPerTime was defided");
		}
		else {
			console.log("there is progress file, read it");
			const file = (await vscode.workspace.fs.readFile(progressFileUri[0])).toString();
			const file_content:dataStructure = JSON.parse(file);
			docsStatusesPerTime = {
				"updateTime": new Date(file_content.updateTime),
				"projectName": file_content.projectName,
				"filesData": file_content.filesData
			}
		}
	}
	else {
		console.log('no workspace folders');
	}
	
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(updateData));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(updateData));

	await updateData();
}

// this method is called when your extension is deactivated
export async function deactivate(context: vscode.ExtensionContext) {
	let close = vscode.commands.registerCommand('someext.CloseIt', async () => {
		vscode.workspace.saveAll();
		vscode.window.showInformationMessage('I closes(');
		progressStatusBarItem.hide();
	});
	context.subscriptions.push(close);
}

async function updateData(): Promise<void> {
	await updateLines();
	updateStatusBar();
	await updateProgressFile();
}

function createStatusBarItemMessageLines(lines: number): string {
	let message = "";
	if (lines < 0) {
		vscode.window.showInformationMessage('Looks like you are on regression or some refactoring..');
	}
	if (lines == 0) {
		message = `No new lines per last ${maxMinutes} minutes`;
	}
	else {
		message = `New lines: ${lines} per last ${maxMinutes} minutes`;
	}
	return message;
}

/**
 * Обновляет текущие значения файла "/progress.json"
 * в соответсвии со значениями в массиве {docsStatusesPerTime}
 */
async function updateProgressFile() {
	console.log("update progress file");
	if (vscode.workspace.workspaceFolders !== undefined) {
		const uri  = vscode.workspace.workspaceFolders[0].uri;
		const progressFileUri = vscode.Uri.parse(uri.path + "/progress.json");
		const content: dataStructure = docsStatusesPerTime;
		await vscode.workspace.fs.writeFile(progressFileUri, new TextEncoder().encode(JSON.stringify(content)));
		const file = (await vscode.workspace.fs.readFile(progressFileUri)).toString();
	}
	else {
		console.log('no workspace folders');
	}
}

/**
 * Функция обновляет внутренние значения количества строк в файлах
 * @return {Promise<void>}
 */
async function updateLines() : Promise<void> {
	const prevTime = docsStatusesPerTime.updateTime;
	curTime = new Date();
	const diff_minutes = (curTime.getTime() - prevTime.getTime()) / 60000.0;
	console.log(diff_minutes);
	console.log("update lines");
	let files = await getFiles('*/', 'progress.json');
	if (files == undefined) {
		console.log("no files in project directory");
		return;
	}
	let cur_names_files = await getLinesForFiles(files);
	// if docsStatusesPerTime.filesData now empty, defind them and return
	if (docsStatusesPerTime.filesData == undefined) {
		docsStatusesPerTime.filesData = cur_names_files;
	}
	// check for new files and update lines for existing
	for (var name_file of cur_names_files) {
		var name = name_file.name;
		if (name == "") {
			continue;
		}
		var inCur = docsStatusesPerTime.filesData.findIndex(el => el.name == name);
		if (inCur != -1) {
			// if file existes - update cur and prev
			var prevLines = docsStatusesPerTime.filesData[inCur].curLines;
			var curLines = name_file.curLines;
			// if we need to fix progress per maxMinutes
			if (diff_minutes >= maxMinutes) {
				docsStatusesPerTime.updateTime = curTime;
				docsStatusesPerTime.filesData[inCur].prevLines = prevLines;
			}
			docsStatusesPerTime.filesData[inCur].curLines = curLines;
			console.log(`update data for file ${name}: prev = ${prevLines}, cur = ${curLines}`)
		}
		else {
			name_file.prevLines = 0;
			docsStatusesPerTime.filesData.push(name_file);
			console.log(`for new file ${name}: prev= 0, cur = ${name_file.curLines}`);
		}
	}
	// check for deleted files: we should to zero theier cur lines
	for (var name_file of docsStatusesPerTime.filesData) {
		var name = name_file.name;
		var inCur = cur_names_files.findIndex(el => el.name == name);
		if (inCur == -1) {
			name_file.prevLines = name_file.curLines;
			name_file.curLines = 0;
		}
	}
}

/**
 * Функция обновляет данные StatusBar в соответсвии со значениями в массиве {docsStatusesPerTime}
 */
function updateStatusBar() : void {
	console.log("update status bar");
	let newLines = 0;
	docsStatusesPerTime.filesData?.forEach((doc) => {
		let name = doc.name
		if (doc.curLines != doc.prevLines) {
			newLines += doc.curLines - (doc.prevLines !=undefined? doc.prevLines: 0);
			console.log(`in doc ${name} with l ${doc.prevLines} added ${newLines} lines`);
		}
	});
	let textLines = createStatusBarItemMessageLines(newLines);
	progressStatusBarItem.text = textLines;
	progressStatusBarItem.show();
}
