import * as vscode from 'vscode';
import JSZip = require('jszip');
const htmlcontainer = require("./htmlcontainer");
const htmlmessage = require("./htmlmessage");
const view = require("./view");
const os = require('os')
const fs = require("fs");
const path = require("path");

let tempFolder = "";
let tempFolderList: string[] = new Array();
let tempAllFoldersExtracted: Boolean[] = new Array(false, false);
let panel: vscode.WebviewPanel;
let screenList = new Array();

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('powerappscodecomparer.pacodecomparer', () => {

		//vscode.window.showInformationMessage('Select two PowerApps files for comparison');
		const options: vscode.OpenDialogOptions = {
			canSelectFolders: false,
			canSelectFiles: true,
			canSelectMany: true,
			openLabel: 'Open',
			title: 'Select two PowerApps files for comparison',
			filters: {
				'PowerApps Files': ['msapp']
			}
		};

		// clear temp folder names
		tempFolderList = [];
		tempAllFoldersExtracted = [false, false];

		vscode.window.showOpenDialog(options).then(function (filesUri: any) {
			if (filesUri && filesUri.length == 2) {
				// Create and show panel
				panel = vscode.window.createWebviewPanel(
					'PowerApps',
					'PowerApps Comparer',
					vscode.ViewColumn.One,
					{
						enableScripts: true
					}
				);

				panel.webview.onDidReceiveMessage(
					message => {
						switch (message.command) {
							case 'alert':
								let oFileContent = fs.readFileSync(path.join(tempFolderList[0], 'o' + message.text));
								let nFileContent = fs.readFileSync(path.join(tempFolderList[1], 'n' + message.text));

								panel.webview.html = htmlcontainer(
									oFileContent
									, nFileContent
									, screenList
									, message.text);
								return;
						}
					},
					undefined,
					context.subscriptions
				);

				// And set its HTML content
				//panel.webview.html = htmlcontainer("Please wait while loading...", "Please wait while loading...", [], "");
				panel.webview.html = htmlmessage("Please wait while loading...");

				// ensure temp folders are created
				try {
					tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'pac-'));
				}
				catch (err) {
					vscode.window.showErrorMessage('Unable to create temporary directory. Please try again.');
					return;
				}

				panel.webview.html = htmlmessage("Creating temporary directory...");

				let count: number = 0;
				filesUri.forEach((file: any) => {
					fs.readFile(file.fsPath, function (err: any, data: any) {
						if (err) throw err;

						// temp/msappfileV1/
						let appfldr = path.join(tempFolder, path.basename(file.fsPath, '.msapp'));
						panel.webview.html = htmlmessage(`Reading Data for ${path.basename(file.fsPath, '.msapp')}...`);
						tempFolderList.push(appfldr);
						fs.mkdirSync(appfldr);
						panel.webview.html = htmlmessage(`Extracting data for ${path.basename(file.fsPath, '.msapp')}...`);
						extractOriginalFiles(data, appfldr, 'Controls', count);

						count++;
					});
				});

			}
			else {
				vscode.window.showErrorMessage('Please select only two PowerApps files to compare');
			}
		});

	});

	context.subscriptions.push(disposable);
}

function extractOriginalFiles(data: any, fldrToSave: string, fldrToExtract: string, fldrCount: number) {

	JSZip.loadAsync(data).then(function (zip: any) {

		let filecount: number = 0;
		let fileprocesscount: number = 0;

		zip.forEach(function (relativePath: string, zipEntry: any) {
			// CONTROLS FOLDER
			if (zipEntry.name.includes(fldrToExtract)) {
				filecount++;
			}
		});

		zip.forEach(function (relativePath: string, zipEntry: any) {
			// CONTROLS FOLDER
			if (zipEntry.name.includes(fldrToExtract)) {
				let content: any = zip.files[zipEntry.name].async("string");
				content.then(function (result: string) {
					let jdata = JSON.parse(result);
					let screenname = jdata.TopParent.Name;
					fileprocesscount++;

					// ensure file is saved for comparison - DO NOT USE ASYNC
					fs.writeFileSync(path.join(fldrToSave, screenname + '.json'), result, 'utf8');
					panel.webview.html = htmlmessage(`Creating temporary file - ${screenname} ...`);
					if (fileprocesscount >= filecount) {
						tempAllFoldersExtracted[fldrCount] = true;
						storeControlData();
					}
				});
			}
		});
	});
}

function storeControlData() {

	panel.webview.html = htmlmessage(`start to store control data ...`);
	if (tempAllFoldersExtracted[0] == tempAllFoldersExtracted[1]) {
		//console.log(tempFolderList);
		let oFiles: string[] = fs.readdirSync(tempFolderList[0], 'utf8');
		let nFiles: string[] = fs.readdirSync(tempFolderList[1], 'utf8');

		let sequenceArray: number[] = [];

		for (let index = 0; index < oFiles.length; index++) {
			// CHECK FILE EXISTS IN OTHER APP HERE
			if (nFiles.includes(oFiles[index])) {
				let ofName = path.join(tempFolderList[0], oFiles[index]);
				let content = fs.readFileSync(ofName, 'utf8');
				let jFinalData = JSON.parse('[]');
				let sequence: any = { No: 1 };

				panel.webview.html = htmlmessage(`Reading control data for - ${path.basename(ofName, '.json')} ...`);

				readJsonFile(jFinalData, JSON.parse(content), tempFolderList[0], `o${path.basename(ofName, '.json')}`, sequence);
				sequenceArray.push(sequence.No);
			}
		}

		for (let index = 0; index < nFiles.length; index++) {
			// CHECK FILE EXISTS IN OTHER APP HERE
			if (oFiles.includes(nFiles[index])) {
				let nfName = path.join(tempFolderList[1], nFiles[index]);
				let content = fs.readFileSync(nfName, 'utf8');
				let jFinalData = JSON.parse('[]');
				let sequence: any = { No: sequenceArray[index] };
				panel.webview.html = htmlmessage(`Reading control data for - ${path.basename(nfName, '.json')} ...`);
				readJsonFile(jFinalData, JSON.parse(content), tempFolderList[1], `n${path.basename(nfName, '.json')}`, sequence);
			}
		}

		// FIND DIFFERENCES

		// V1 FOLDER PATH
		for (let index = 0; index < oFiles.length; index++) {
			if (nFiles.includes(oFiles[index])) {
				// V1 FILES
				let ofName = path.join(tempFolderList[0], `o${oFiles[index]}`);
				let oJData = JSON.parse(fs.readFileSync(ofName, 'utf8'));

				// V2 FILES
				let nfName = path.join(tempFolderList[1], `n${nFiles[index]}`);
				let nJData = JSON.parse(fs.readFileSync(nfName, 'utf8'));

				try {
					panel.webview.html = htmlmessage(`Checking difference for - ${path.basename(ofName, '.json')} ...`);
					checkFileDifferences(oJData, nJData, ofName, nfName);  // V1 V2 
				}
				catch (err) {
					vscode.window.showErrorMessage('Error while checking differences. Cannot proceed further. ' + err);
					return;
				}
				try {
					addExtraRows(ofName, nfName);
				}
				catch (err) {
					vscode.window.showErrorMessage('Error adding extra rows - ' + err);
					return;
				}

				 try {
					//updateRowIndex(ofName, nfName);
				}
				catch (err) {
					vscode.window.showErrorMessage('Error while checking differences. Cannot proceed further. ' + err);
					return;
				} 
			}
		}

		deleteTempFiles(true);
		panel.webview.html = htmlmessage(`Almost done. Preparing views...`);
		if (view.createHTML(tempFolderList)) {
			screenList = view.getScreenNames('o', tempFolderList[0]);

			//vscode.window.showInformationMessage("All done!!! Ready to view");
			let message = screenList[0];   //"App.html";
			let oFileContent = fs.readFileSync(path.join(tempFolderList[0], 'o' + message), 'utf8');
			let nFileContent = fs.readFileSync(path.join(tempFolderList[1], 'n' + message), 'utf8');

			panel.webview.html = htmlcontainer(
				oFileContent
				, nFileContent
				, screenList
				, message);

		} else {
			vscode.window.showErrorMessage("Error processing data");
		}
	}
}

function checkFileDifferences(oJData: any, nJData: any, ofName: string, nfName: string) {

	panel.webview.html = htmlmessage(`Checking differences for ${ofName}  ...`);
	for (let key in oJData) {

		if (Number.parseInt(key) == 0) {
			continue;
		}

		let odt = oJData[key];
		let NotUpdated: Boolean = true;
		nJData.filter(function (vdt: any, idx: any) {
			if (vdt.f2 == odt.f2 && vdt.f5 == odt.f5 && vdt.f6 == odt.f6) {
				oJData[key].f7 = 'Y';
				oJData[key].f8 = 'N';
				NotUpdated = false;
				return;
			}
			else if (vdt.f2 == odt.f2 && vdt.f5 == odt.f5 && vdt.f6 != odt.f6) {
				oJData[key].f7 = 'Y';
				oJData[key].f8 = 'Y';
				NotUpdated = false;
				return;

			}
		});

		// DATA present in V1 only and NOT v2 - data deleted in V1
		if (NotUpdated) {
			oJData[key].f7 = 'Y';
			oJData[key].f8 = 'D';
		}
	}


	try {
		fs.writeFileSync(ofName, JSON.stringify(oJData), 'utf8');
	} catch (err) {
		vscode.window.showErrorMessage('Unable to save data. ' + err);
	}

	panel.webview.html = htmlmessage(`Checking differences for ${nfName}  ...`);
	// DATA present in V2 only and NOT v1 - data added in V2
	for (let key in nJData) {

		if (Number.parseInt(key) == 0) {
			continue;
		}

		let NotUpdated: Boolean = true;
		let ndt = nJData[key];

		oJData.filter(function (vdt: any, idx: any) {
			if (vdt.f2 == ndt.f2 && vdt.f5 == ndt.f5 && vdt.f6 == ndt.f6) {
				nJData[key].f7 = 'Y';
				nJData[key].f8 = 'N';
				NotUpdated = false;
				return;
			}
			else if (vdt.f2 == ndt.f2 && vdt.f5 == ndt.f5 && vdt.f6 != ndt.f6) {
				nJData[key].f7 = 'Y';
				nJData[key].f8 = 'Y';
				NotUpdated = false;
				return;
			}
		});

		// DATA present in V2 only and NOT v1 - data ADDED in V2
		if (NotUpdated) {
			nJData[key].f7 = 'Y';
			nJData[key].f8 = 'A';
		}
	}

	try {
		fs.writeFileSync(nfName, JSON.stringify(nJData), 'utf8');
	} catch (err) {
		vscode.window.showErrorMessage('Unable to save data. ' + err);
	}
}

function addExtraRows(ofName: string, nfName: string) {

	let oJData = JSON.parse(fs.readFileSync(ofName, 'utf8'));// V1 FILES
	let nJData = JSON.parse(fs.readFileSync(nfName, 'utf8'));// V2 FILES

	let oJArray: any = [];
	let nJArray: any = [];
	
	// add to temp array
	for (let rowIndex = 0; rowIndex < oJData.length; rowIndex++) {
		oJArray.push(oJData[rowIndex]);
	}

	let tempJson = JSON.parse(`{"f0":${0}, "f1":"", "f2":"","f3":${0},"f4":${0},"f5":"","f6":"","f7":"","f8":""}`);

	if (oJData.length < nJData.length) {
		for (let rowIndex = 0; rowIndex < (nJData.length - oJData.length); rowIndex++) {
			oJArray.push(tempJson);
		}
	}

	for (let rowIndex = 0; rowIndex < nJData.length; rowIndex++) {
		nJArray.push(nJData[rowIndex]);
	}

	if (nJData.length < oJData.length) {
		for (let rowIndex = 0; rowIndex < (oJData.length - nJData.length); rowIndex++) {
			nJArray.push(tempJson);
		}
	}

	let totalNodes = nJArray.length + oJArray.length;

	for (let rowIndex = 0; rowIndex < totalNodes; rowIndex++) {
		if (rowIndex < oJArray.length  && rowIndex < nJArray.length ) {
			if (oJArray[rowIndex].f8 == 'D') {
				insertDummyRows(nJArray, rowIndex, oJArray[rowIndex].f1, oJArray[rowIndex].f2, oJArray[rowIndex].f3, oJArray[rowIndex].f4, oJArray[rowIndex].f5, 'D');
			}

			if (nJArray[rowIndex].f8 == 'A') {
				insertDummyRows(oJArray, rowIndex, nJArray[rowIndex].f1, nJArray[rowIndex].f2, nJArray[rowIndex].f3, nJArray[rowIndex].f4, nJArray[rowIndex].f5, 'A');
			}
		}
	}

	// REMOVING LEADING BLANK ROWS 
	for(let key in oJArray){
		if(oJArray[key].f2 == ''){
			oJArray.splice(key);
		}
	}

	// 	REMOVING LEADING BLANK ROWS 
	for (let key in nJArray) {
		if (nJArray[key].f2 == '') {
			nJArray.splice(key);
		}
	}

	for (let key in oJArray) {
		oJArray[key].f0 = Number.parseInt(key);
	}

	// 	REMOVING LEADING BLANK ROWS 
	for (let key in nJArray) {
		nJArray[key].f0 = Number.parseInt(key);
	}

	let nTreePath: string = "";
	let nParentKey: number = 0;

	let oTreePath: string = "";
	let oParentKey: number = 0;

	for (let rowIndex = 1; rowIndex < totalNodes; rowIndex++) {
		if (rowIndex < oJArray.length - 1 && rowIndex < nJArray.length - 1) {
			if (nJArray[rowIndex].f8 == 'D') {
				if (nTreePath == '') {
					nTreePath = `${nJArray[rowIndex].f2}|${nJArray[rowIndex].f5}`;
					nParentKey = nJArray[rowIndex].f3;

					let parentKey = getParentKey(nJArray[rowIndex].f4, oJArray);
					nJArray[rowIndex].f4 = nJArray[parentKey].f3;

				}
				else if (nJArray[rowIndex].f2.toString().includes(nTreePath)) {
					nJArray[rowIndex].f4 = nParentKey;
					nJArray[rowIndex].f5 = '&nbsp;';
				}
				else {
					nTreePath = `${nJArray[rowIndex].f2}|${nJArray[rowIndex].f5}`;
					nParentKey = nJArray[rowIndex].f3;
					
					let parentKey = getParentKey(nJArray[rowIndex].f4, oJArray);
					nJArray[rowIndex].f4 = nJArray[parentKey].f3;
				}
				
			}

			if (oJArray[rowIndex].f8 == 'A') {
				if (oTreePath == '') {
					oTreePath = `${oJArray[rowIndex].f2}|${oJArray[rowIndex].f5}`;
					oParentKey = oJArray[rowIndex].f3;

					let parentKey = getParentKey(oJArray[rowIndex].f4, nJArray);
					oJArray[rowIndex].f4 = oJArray[parentKey].f3;

				}
				else if (oJArray[rowIndex].f2.toString().includes(oTreePath)) {
					oJArray[rowIndex].f4 = oParentKey;
					oJArray[rowIndex].f5 = '&nbsp;';
				}
				else {

					oTreePath = `${oJArray[rowIndex].f2}|${oJArray[rowIndex].f5}`;
					oParentKey = oJArray[rowIndex].f3;

					let parentKey = getParentKey(oJArray[rowIndex].f4, nJArray);
					oJArray[rowIndex].f4 = oJArray[parentKey].f3;
				}
				
			}
		}
	}

	try {
		fs.writeFileSync(nfName, JSON.stringify(nJArray), 'utf8');
		fs.writeFileSync(ofName, JSON.stringify(oJArray), 'utf8');
	} catch (err) {
		vscode.window.showErrorMessage('addExtraRows - Unable to save data. ' + err);
	}
}

function getParentKey( currentKey : number, data: any){

	let finalKey:number = 0;
	for(let key in data){
		if(data[key].f3 == currentKey){
			finalKey = data[key].f0;
			break;
		}
	}

	return finalKey;
}

function insertDummyRows(jsonNode: any, rowIndex: number, SCREEN_NAME: string, TREE_PATH: string, PARENT_KEY: number, CHILD_KEY: number, PROP_NAME: string, DIFF_FOUND: string) {
	let json = JSON.parse(`{"f0":${0}, "f1":"${SCREEN_NAME}", "f2":"${TREE_PATH}","f3":${PARENT_KEY},"f4":${CHILD_KEY},"f5":"${PROP_NAME}","f6":"","f7":"Y","f8":"${DIFF_FOUND}"}`);
	jsonNode.splice(rowIndex, 0, json);
}

function readJsonFile(jFinalData: any, data: any, foldername: string, filename: string, sequence: any) {

	// f1:"SCREEN_NAME", f2:"TREE_PATH", f3:"PARENT_KEY", f4:"CHILD_KEY", f5:"PROP_NAME", f6:"PROP_VALUE", f7:"COMPARED", f8:"DIFF_FOUND"

	// temp/msappfileV1/screenname

	let screenName: string = data.TopParent.Name;
	let tempseq = sequence.No++;
	let actualFileName: string = "";

	if (foldername.lastIndexOf('\\') != -1) {
		actualFileName = foldername.substring(foldername.lastIndexOf('\\') + 1);
	}
	else {
		actualFileName = foldername.substring(foldername.lastIndexOf('/') + 1);
	}

	addDataToJson(jFinalData, screenName, screenName, tempseq, -1, `${screenName} - ${actualFileName}`, screenName, 'N', 'N');
	if (readAllProperties(data.TopParent, screenName, tempseq, screenName, jFinalData, sequence)) {
		try {
			fs.writeFileSync(path.join(foldername, filename + '.json'), `[${jFinalData}]`, 'utf8');
			//console.log(jFinalData);
		} catch (err) {
			vscode.window.showErrorMessage('Unable to save data. ' + err);
		}
	}
}

function readAllProperties(jdata: any, treePath: string, childKey: number, screenName: string, jFinalData: any, sequence: any) {

	let currentParentKey: number;

	try {
		for (let key in jdata) {

			let tdata: any = jdata[key];

			if (Array.isArray(tdata)) {
				currentParentKey = sequence.No++;

				addDataToJson(jFinalData, screenName, treePath, currentParentKey, childKey, key, key, 'N', 'N');
				let parentArrayKey: number = currentParentKey;
				let arrayProcessed: Boolean = false;
				let props: string = "";
				for (let index = 0; index < tdata.length; index++) {
					if ((typeof (tdata[index]) === 'object')) {
						arrayProcessed = true;
						if (key == 'Rules') {
							//let tempArrChildKey: number = sequence.No++;
							let oJData: any = tdata[index];

							//addDataToJson(jFinalData, screenName, treePath + '|' + key, tempArrChildKey, parentArrayKey, oJData.Property, oJData.Property, 'N', 'N');
							//readAllProperties(oJData, treePath + '|' + key + '|' + oJData.Property, tempArrChildKey, screenName, jFinalData, sequence);
							let props: string = "";
							for (let ckey in oJData) {
								props += `${ckey}: ${oJData[ckey]}|`;
							}

							currentParentKey = sequence.No++;
							addDataToJson(jFinalData, screenName, treePath + '|' + key + '|' + oJData.Property, currentParentKey, parentArrayKey, oJData.Property, props, 'N', 'N');

						}
						else if (key == 'ControlPropertyState') {
							let tempArrChildKey: number = sequence.No++;
							let oJData: any = tdata[index];

							//	addDataToJson(jFinalData, screenName, treePath + '|' + key, tempArrChildKey, parentArrayKey, oJData.InvariantPropertyName, oJData.InvariantPropertyName, 'N', 'N');
							//readAllProperties(oJData, treePath + '|' + key + '|' + oJData.InvariantPropertyName, tempArrChildKey, screenName, jFinalData, sequence);

							let props: string = "";
							for (let ckey in oJData) {
								props += `${ckey}: ${oJData[ckey]}|`;
							}

							currentParentKey = sequence.No++;
							//	addDataToJson(jFinalData, screenName, treePath + '|' + key + '|' + oJData.InvariantPropertyName, currentParentKey, tempArrChildKey, oJData.InvariantPropertyName, props, 'N', 'N');

						}
						else if (key == 'Children') {
							let tempArrChildKey: number = sequence.No++;
							let oJData: any = tdata[index];

							addDataToJson(jFinalData, screenName, treePath + '|' + key, tempArrChildKey, parentArrayKey, oJData.Name, oJData.Name, 'N', 'N');

							let containsData: Boolean = false;
							for (let tk in oJData) {
								containsData = true;
								break;
							}

							if (containsData) {
								readAllProperties(oJData, treePath + '|' + key + '|' + oJData.Name, tempArrChildKey, screenName, jFinalData, sequence);
							}
						}
						else {
							currentParentKey = sequence.No++;
							addDataToJson(jFinalData, screenName, treePath, currentParentKey, childKey, key, key, 'N', 'N');

							let oJData: any = tdata[index];
							let containsData: Boolean = false;
							for (let tk in oJData) {
								containsData = true;
								break;
							}

							if (containsData) {
								readAllProperties(oJData, treePath + '|' + key, currentParentKey, screenName, jFinalData, sequence);
							}
						}
					}
					else { // this shud be else if jvalue
						props += `${tdata[index]}|`;
					}

					//currentParentKey = sequence.No++;
					//addDataToJson(jFinalData, screenName, treePath + '|' + key, currentParentKey, parentArrayKey, tdata[index], tdata[index], 'N', 'N');
				}

				if (!arrayProcessed) {

					currentParentKey = sequence.No++;
					addDataToJson(jFinalData, screenName, treePath + '|' + key, currentParentKey, parentArrayKey, key, props, 'N', 'N');

				}
			}
			// OBJECT containing json data
			else if (typeof (tdata) === 'object') {
				currentParentKey = sequence.No++;
				addDataToJson(jFinalData, screenName, treePath, currentParentKey, childKey, key, key, 'N', 'N');

				let props: string = "";
				for (let ckey in tdata) {

					if (typeof (tdata[ckey]) === 'object') {
						let containsData = false;
						for (let k in tdata[ckey]) {
							containsData = true;
							props += `${k}: ${tdata[ckey][k]}|`;
						}

						if (!containsData) {
							props += `${ckey}:}|`;
						}

					}
					else {
						props += `${ckey}: ${tdata[ckey]}|`;
					}
				}

				if (props != '') {
					let tempArrChildKey = sequence.No++;
					addDataToJson(jFinalData, screenName, treePath + '|' + key, tempArrChildKey, currentParentKey, key, props, 'N', 'N');
				}

				/* let containsData: Boolean = false;
				for (let tk in tdata) {
					containsData = true;
					break;
				}

				if (containsData) {
					readAllProperties(tdata, treePath + '|' + key, currentParentKey, screenName, jFinalData, sequence);
				} */
			}
			// key:Value pair 
			else {
				currentParentKey = sequence.No++;
				addDataToJson(jFinalData, screenName, treePath, currentParentKey, childKey, key, tdata, 'N', 'N');
			}
		}
	}
	catch (err) {
		vscode.window.showErrorMessage('Error while reading all properties. ' + err);
		return false;
	}
	return true;

}

function deleteTempFiles(conditional: Boolean) {

	let oFiles: string[] = fs.readdirSync(tempFolderList[0], 'utf8');
	let nFiles: string[] = fs.readdirSync(tempFolderList[1], 'utf8');

	oFiles.forEach(function (file: string) {
		if (conditional) {
			if (!file.startsWith('o')) {
				fs.unlink(path.join(tempFolderList[0], file), function (err: any) {
					if (err) throw err;
				});
			}
		}
		else {
			fs.unlink(path.join(tempFolderList[0], file), function (err: any) {
				if (err) throw err;
			});
		}
	});

	nFiles.forEach(function (file: string) {
		if (conditional) {
			if (!file.startsWith('n')) {
				fs.unlink(path.join(tempFolderList[1], file), function (err: any) {
					if (err) throw err;
				});
			}
		}
		else {
			fs.unlink(path.join(tempFolderList[1], file), function (err: any) {
				if (err) throw err;
			});
		}
	});
}

const removeDirRecursive = function (path: string) {
	if (fs.existsSync(path)) {
		const files = fs.readdirSync(path)

		if (files.length > 0) {
			files.forEach(function (filename: string) {
				if (fs.statSync(path + "/" + filename).isDirectory()) {
					removeDirRecursive(path + "/" + filename)
				} else {
					fs.unlinkSync(path + "/" + filename)
				}
			})
			fs.rmdirSync(path)
		} else {
			fs.rmdirSync(path)
		}
	}
}

function addDataToJson(jsonNode: any, SCREEN_NAME: string, TREE_PATH: string, PARENT_KEY: number, CHILD_KEY: number,
	PROP_NAME: string, PROP_VALUE: string, COMPARED: string, DIFF_FOUND: string) {

	var VALUE = escape(PROP_VALUE);
	jsonNode.push(
		`{"f0":${0}, "f1":"${SCREEN_NAME}", "f2":"${TREE_PATH}","f3":${PARENT_KEY},"f4":${CHILD_KEY},"f5":"${PROP_NAME}","f6":"${VALUE}","f7":"${COMPARED}","f8":"${DIFF_FOUND}"}`);

}

function updateRowIndex(ofName: string, nfName: string) {

	let oJData = JSON.parse(fs.readFileSync(ofName, 'utf8'));
	let nJData = JSON.parse(fs.readFileSync(nfName, 'utf8'));

	for (let key in oJData) {
		oJData[key].f0 = Number.parseInt(key);
	}

	try {
		fs.writeFileSync(ofName, JSON.stringify(oJData), 'utf8');

	} catch (err) {
		vscode.window.showErrorMessage('Unable to save data. ' + err);
	}

	for (let key in nJData) {
		nJData[key].f0 = Number.parseInt(key);
	}

	try {
		fs.writeFileSync(nfName, JSON.stringify(nJData), 'utf8');
	} catch (err) {
		vscode.window.showErrorMessage('Unable to save data. ' + err);
	}

/* 	let csvData = "f0, f1, f2, f3, f4, f5, f6, f7, f8\r\n";
	for (let key in oJData) {
		csvData += `"${oJData[key].f0}", "${oJData[key].f1}", "${oJData[key].f2}", "${oJData[key].f3}", "${oJData[key].f4}", "${oJData[key].f5}", "${oJData[key].f6}", "${oJData[key].f7}", "${oJData[key].f8}" \r\n`;
	}

	let filename = `o${oJData[0].f1}.csv`;
	fs.writeFileSync(path.join(tempFolder, filename), csvData, 'utf8');

	csvData = "f0, f1, f2, f3, f4, f5, f6, f7, f8\r\n";
	for (let key in nJData) {
		csvData += `"${nJData[key].f0}", "${nJData[key].f1}", "${nJData[key].f2}", "${nJData[key].f3}", "${nJData[key].f4}", "${nJData[key].f5}", "${nJData[key].f6}", "${nJData[key].f7}", "${nJData[key].f8}" \r\n`;
	}

	filename = `n${oJData[0].f1}.csv`;
	fs.writeFileSync(path.join(tempFolder, filename), csvData, 'utf8'); */

}

// this method is called when your extension is deactivated
export function deactivate() {
	try {
		removeDirRecursive(tempFolder);
	}
	catch (err) {
		throw err;
	}
}