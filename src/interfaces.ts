export interface filesDataStucture {
	"name": string,
	"prevLines"?: number,
	"curLines": number
}

export interface dataStructure {
	"updateTime": Date,
	"projectName": string,
	"filesData"?: [filesDataStucture]
}

/* export interface timeProgressStructure {
	"updateTime": Date,
	"filesDate"?: [filesDataStucture]
}
export interface progressDataStrucure {
	"projectName": string,
	"progressTime": number,
	"progressPerTime": [timeProgressStructure]
} */