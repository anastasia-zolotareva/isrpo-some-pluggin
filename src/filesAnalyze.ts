import {Uri, workspace} from 'vscode';
import { filesDataStucture } from './interfaces';
import { getNumberOfLines } from './getNumberOfLines';

export async function getLinesForFiles(files: Array<Uri>): Promise<[filesDataStucture]> {
	let arr: [filesDataStucture] = [{'name': '', "curLines":0}];
	for (const file of files) {
		let file_content = (await workspace.fs.readFile(file)).toString();
		let name = file.path.toString();
		let lines = getNumberOfLines(file_content);
		let obj: filesDataStucture = {"name": name, "curLines": lines};
		arr.push(obj);
	}
	return arr;
}

export async function getFiles(path: string, excude_path: string | null): Promise<Uri[] | undefined> {
	let files = await workspace.findFiles(path, excude_path);
	console.log("finded files:");
	console.log(typeof(files));
	return files;
}

