export function getNumberOfLines(text : string) : number {
	let textLines = text?.split('\n');

	let lines = 0
	textLines?.forEach((value:string) => {
		let match = value.match('.+')?.length;
		lines += match == undefined? 0: match;
	});

	return lines == undefined? 0:lines;
}