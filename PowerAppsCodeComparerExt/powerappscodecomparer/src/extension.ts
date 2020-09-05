import * as vscode from "vscode";
import JSZip = require("jszip");
const htmlcontainer = require("./htmlcontainer");
const screen = require("./screenSelection");
const view = require("./view");
const os = require("os");
const fs = require("fs");
const path = require("path");
 
let tempFolder = "";
let tempFolderList: string[] = new Array();
let tempAllFoldersExtracted: Boolean[] = new Array(false, false);
let panel: vscode.WebviewPanel;
let screenList = new Array();
let customFilePaths: string[] = new Array();

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		"powerappscodecomparer.pacodecomparer",
		() => {
			//vscode.window.showInformationMessage('Select two PowerApps files for comparison');
			const options: vscode.OpenDialogOptions = {
				canSelectFolders: false,
				canSelectFiles: true,
				openLabel: "Open",
				filters: {
					"PowerApps Files": ["msapp"],
				},
			};

			// ensure temp folders are created
			try {
				tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "pac-"));
			} catch (err) {
				vscode.window.showErrorMessage(
					"Unable to create temporary directory. Please try again."
				);
				return;
			}

			// clear temp folder names
			tempFolderList = [];
			tempAllFoldersExtracted = [false, false];

			// Create and show panel
			panel = vscode.window.createWebviewPanel(
				"PowerApps",
				"PowerApps Comparer",
				vscode.ViewColumn.One,
				{
					enableScripts: true,
				}
			);

			panel.webview.html = screen.screenSel("");

			panel.webview.onDidReceiveMessage(
				(message) => {
					switch (message.command) {
						case "screenchange":
							let fileContent = fs.readFileSync(path.join(tempFolder, message.text), "utf8");
							panel.webview.html = htmlcontainer(fileContent, screenList, message.text);
							return;
						case "old":
							// receives msg from html button click
							options.title = "Select PowerApps file";
							options.canSelectMany = false;
							vscode.window
								.showOpenDialog(options)
								.then(function (filesUri: any) {
									filesUri.forEach((file: any) => {
										let fname = path.basename(file.fsPath, ".msapp");
										let fpath = file.fsPath;
										customFilePaths[0] = fpath;
										// sends msg to window.addEventListener
										panel.webview.postMessage({ index: 1, filename: fname, filepath: fpath });
									});
								});
							return;

						case "new":
							// receives msg from html button click
							options.title = "Select PowerApps file";
							options.canSelectMany = false;
							vscode.window
								.showOpenDialog(options)
								.then(function (filesUri: any) {
									filesUri.forEach((file: any) => {
										let fname = path.basename(file.fsPath, ".msapp");
										let fpath = file.fsPath;
										customFilePaths[1] = fpath;
										// sends msg to window.addEventListener
										panel.webview.postMessage({ index: 2, filename: fname, filepath: fpath, patharray: fpath.split('\\') });
									});
								});
							return;

						case "ShowScreens":
							let paths = JSON.parse(message.text);
							let count: number = 0;
							tempFolderList = [];
							tempAllFoldersExtracted = [false, false];

							if (!createTempFolder())
								return;

							paths.forEach(function (item: any) {
								fs.readFile(customFilePaths[item.path], function (err: any, data: any) {
									if (err) throw err;

									// temp/msappfileV1/
									let appfldr = path.join(tempFolder, path.basename(customFilePaths[item.path], ".msapp"));
									tempFolderList[item.path] = appfldr;
									fs.mkdirSync(appfldr);
									extractOriginalFiles(data, appfldr, "Controls", count, false);

									count++;
								});
							});
							return;

						case "AutoRun":
							options.title = "Select two PowerApps files";
							options.canSelectMany = true;
							vscode.window
								.showOpenDialog(options)
								.then(function (filesUri: any) {
									if (filesUri && filesUri.length == 2) {
										if (!createTempFolder())
											return;

										tempFolderList = [];
										let count: number = 0;
										filesUri.forEach((file: any) => {
											fs.readFile(file.fsPath, function (err: any, data: any) {
												if (err) throw err;

												// temp/msappfileV1/
												let appfldr = path.join(tempFolder, path.basename(file.fsPath, ".msapp"));
												tempFolderList.push(appfldr);
												fs.mkdirSync(appfldr);
												extractOriginalFiles(data, appfldr, "Controls", count, true);
												count++;
											});
										});
									}
								});
							return;
						case "CompareFiles":
							compareFiles(message.text);
							return;
					}
				},
				undefined,
				context.subscriptions
			);
		}
	);

	context.subscriptions.push(disposable);
}

function createTempFolder() {
	if (fs.existsSync(tempFolder)) {
		try {
			removeDirRecursive(tempFolder);
		}
		catch (err) {
			panel.webview.postMessage({ index: -1, error: "Error deleting temporary directory. Please try again.<br>" + err });
			return false;
		}
	}

	// ensure temp folders are created
	try {
		tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "pac-"));
	} catch (err) {
		panel.webview.postMessage({ index: -1, error: "Unable to create temporary directory. Please try again.<br>" + err });
		vscode.window.showErrorMessage("Unable to create temporary directory. Please try again.");
		return false;
	}

	return true;
}

function extractOriginalFiles(data: any, fldrToSave: string, fldrToExtract: string, fldrCount: number, autoCompare: boolean) {
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
					fs.writeFileSync(path.join(fldrToSave, screenname + ".json"), result, "utf8");

					if (fileprocesscount >= filecount) {
						tempAllFoldersExtracted[fldrCount] = true;
						if (autoCompare) {
							try {
								storeControlData();
							}
							catch (err) {
								panel.webview.postMessage({ index: -1, error: "Error while auto comparing files. Please try again.<br>" + err });
							}
						} else {
							if (tempAllFoldersExtracted[0] == tempAllFoldersExtracted[1]) {
								let oFiles: string[] = fs.readdirSync(tempFolderList[0], "utf8");
								let nFiles: string[] = fs.readdirSync(tempFolderList[1], "utf8");

								// precook data in node instead of javascript
								let rJson: string = "";
								for (let i = 0; i < oFiles.length; i++) {
									if (nFiles.includes(oFiles[i])) {
										rJson += `{"oname": "${path.basename(oFiles[i], ".json")}", "nname": "${path.basename(oFiles[i], ".json")}" },`;
									} else {
										rJson += `{"oname": "${path.basename(oFiles[i], ".json")}", "nname": "" },`;
									}
								}

								for (let i = 0; i < nFiles.length; i++) {
									if (!oFiles.includes(nFiles[i])) {
										rJson += `{"oname": "", "nname": "${path.basename(nFiles[i], ".json")}" },`;
									}
								}

								panel.webview.postMessage({
									index: 3,
									filenames: `[${rJson}{"oname": "", "nname":""}]`, // extra comma from above concat
								});
							}
						}
					}
				});
			}
		});
	});
}

function compareFiles(selScreens: string) {
	try {
		let files: string[] = selScreens.split(",");

		let oFiles: string[] = fs.readdirSync(tempFolderList[0], "utf8");
		let nFiles: string[] = fs.readdirSync(tempFolderList[1], "utf8");

		for (let i = 0; i < oFiles.length; i++) {
			if (!files.includes(path.basename(oFiles[i], '.json'))) {
				fs.unlinkSync(path.join(tempFolderList[0], oFiles[i]));
			}
		}

		for (let i = 0; i < nFiles.length; i++) {
			if (!files.includes(path.basename(nFiles[i], '.json'))) {
				fs.unlinkSync(path.join(tempFolderList[1], nFiles[i]));
			}
		}
		storeControlData();
	}
	catch (err) {
		panel.webview.postMessage({ index: -1, error: "Error while comparing files. Please try again.<br>" + err });
	}

}

function storeControlData() {

	if (tempAllFoldersExtracted[0] == tempAllFoldersExtracted[1]) {
		let oFiles: string[] = fs.readdirSync(tempFolderList[0], "utf8");
		let nFiles: string[] = fs.readdirSync(tempFolderList[1], "utf8");

		let commonScreens: string[] = [];
		for (let i = 0; i < oFiles.length; i++) {
			if (nFiles.includes(oFiles[i])) {
				commonScreens.push(oFiles[i]);
			}
		}

		let sequenceArray: number[] = [];

		for (let index = 0; index < commonScreens.length; index++) {
			// CHECK FILE EXISTS IN OTHER APP HERE
			//if (nFiles.includes(oFiles[index])) {
			let ofName = path.join(tempFolderList[0], commonScreens[index]);
			let content = fs.readFileSync(ofName, "utf8");
			let jFinalData = JSON.parse("[]");
			let sequence: any = { No: 1 };

			readJsonFile(jFinalData, JSON.parse(content), tempFolderList[0], `o${path.basename(ofName, ".json")}`, sequence);
			sequenceArray.push(sequence.No);
			//}
		}

		for (let index = 0; index < commonScreens.length; index++) {
			// CHECK FILE EXISTS IN OTHER APP HERE
			//if (oFiles.includes(nFiles[index])) {
			let nfName = path.join(tempFolderList[1], commonScreens[index]);
			let content = fs.readFileSync(nfName, "utf8");
			let jFinalData = JSON.parse("[]");
			let sequence: any = { No: sequenceArray[index] };
			readJsonFile(jFinalData, JSON.parse(content), tempFolderList[1], `n${path.basename(nfName, ".json")}`, sequence);
			//}
		}

		// FIND DIFFERENCES

		// V1 FOLDER PATH
		for (let index = 0; index < commonScreens.length; index++) {
			//if (nFiles.includes(oFiles[index])) {
			// V1 FILES
			let ofName = path.join(tempFolderList[0], `o${commonScreens[index]}`);
			let oJData = JSON.parse(fs.readFileSync(ofName, "utf8"));

			// V2 FILES
			let nfName = path.join(tempFolderList[1], `n${commonScreens[index]}`);
			let nJData = JSON.parse(fs.readFileSync(nfName, "utf8"));

			try {
				checkFileDifferences(oJData, nJData, ofName, nfName); // V1 V2
			} catch (err) {
				vscode.window.showErrorMessage(
					"Error while checking differences. Cannot proceed further. " + err
				);
				return;
			}
			try {
				addExtraRows(ofName, nfName);
			} catch (err) {
				vscode.window.showErrorMessage("Error adding extra rows - " + err);
				return;
			}
			//}
		}

		if (view.createHTML(tempFolderList, tempFolder)) {
			screenList = view.getScreenNames(tempFolder);
			deleteTempFiles(true);

			let message = screenList[0]; //"App.html";
			let fileContent = fs.readFileSync(path.join(tempFolder, message), "utf8");

			panel.webview.html = htmlcontainer(fileContent, screenList, message);
		} else {
			vscode.window.showErrorMessage("Error processing data");
		}
	}
}

function checkFileDifferences(oJData: any, nJData: any, ofName: string, nfName: string) {
	for (let key in oJData) {
		if (Number.parseInt(key) == 0) {
			continue;
		}

		let odt = oJData[key];
		let NotUpdated: Boolean = true;
		nJData.filter(function (vdt: any, idx: any) {
			if (vdt.f2 == odt.f2 && vdt.f5 == odt.f5 && vdt.f6 == odt.f6) {
				oJData[key].f7 = "Y";
				oJData[key].f8 = "N";
				NotUpdated = false;
				return;
			} else if (vdt.f2 == odt.f2 && vdt.f5 == odt.f5 && vdt.f6 != odt.f6) {
				oJData[key].f7 = "Y";
				oJData[key].f8 = "Y";
				NotUpdated = false;
				return;
			}
		});

		// DATA present in V1 only and NOT v2 - data deleted in V1
		if (NotUpdated) {
			oJData[key].f7 = "Y";
			oJData[key].f8 = "D";
		}
	}

	try {
		fs.writeFileSync(ofName, JSON.stringify(oJData), "utf8");
	} catch (err) {
		vscode.window.showErrorMessage("Unable to save data. " + err);
	}

	// DATA present in V2 only and NOT v1 - data added in V2
	for (let key in nJData) {
		if (Number.parseInt(key) == 0) {
			continue;
		}

		let NotUpdated: Boolean = true;
		let ndt = nJData[key];

		oJData.filter(function (vdt: any, idx: any) {
			if (vdt.f2 == ndt.f2 && vdt.f5 == ndt.f5 && vdt.f6 == ndt.f6) {
				nJData[key].f7 = "Y";
				nJData[key].f8 = "N";
				NotUpdated = false;
				return;
			} else if (vdt.f2 == ndt.f2 && vdt.f5 == ndt.f5 && vdt.f6 != ndt.f6) {
				nJData[key].f7 = "Y";
				nJData[key].f8 = "Y";
				NotUpdated = false;
				return;
			}
		});

		// DATA present in V2 only and NOT v1 - data ADDED in V2
		if (NotUpdated) {
			nJData[key].f7 = "Y";
			nJData[key].f8 = "A";
		}
	}

	try {
		fs.writeFileSync(nfName, JSON.stringify(nJData), "utf8");
	} catch (err) {
		vscode.window.showErrorMessage("Unable to save data. " + err);
	}
}

function addExtraRows(ofName: string, nfName: string) {
	let oJData = JSON.parse(fs.readFileSync(ofName, "utf8")); // V1 FILES
	let nJData = JSON.parse(fs.readFileSync(nfName, "utf8")); // V2 FILES

	let oJArray: any = [];
	let nJArray: any = [];

	// add to temp array
	for (let rowIndex = 0; rowIndex < oJData.length; rowIndex++) {
		oJArray.push(oJData[rowIndex]);
	}

	let tempJson = JSON.parse(
		`{"f0":${0}, "f1":"", "f2":"","f3":${0},"f4":${0},"f5":"","f6":"","f7":"","f8":""}`
	);

	if (oJData.length < nJData.length) {
		for (
			let rowIndex = 0;
			rowIndex < nJData.length - oJData.length;
			rowIndex++
		) {
			oJArray.push(tempJson);
		}
	}

	for (let rowIndex = 0; rowIndex < nJData.length; rowIndex++) {
		nJArray.push(nJData[rowIndex]);
	}

	if (nJData.length < oJData.length) {
		for (
			let rowIndex = 0;
			rowIndex < oJData.length - nJData.length;
			rowIndex++
		) {
			nJArray.push(tempJson);
		}
	}

	let totalNodes = nJArray.length + oJArray.length;

	for (let rowIndex = 0; rowIndex < totalNodes; rowIndex++) {
		if (rowIndex < oJArray.length && rowIndex < nJArray.length) {
			if (oJArray[rowIndex].f8 == "D") {
				insertDummyRows(
					nJArray,
					rowIndex,
					oJArray[rowIndex].f1,
					oJArray[rowIndex].f2,
					oJArray[rowIndex].f3,
					oJArray[rowIndex].f4,
					oJArray[rowIndex].f5,
					"D"
				);
			}

			if (nJArray[rowIndex].f8 == "A") {
				insertDummyRows(
					oJArray,
					rowIndex,
					nJArray[rowIndex].f1,
					nJArray[rowIndex].f2,
					nJArray[rowIndex].f3,
					nJArray[rowIndex].f4,
					nJArray[rowIndex].f5,
					"A"
				);
			}
		}
	}

	// REMOVING LEADING BLANK ROWS
	for (let key in oJArray) {
		if (oJArray[key].f2 == "") {
			oJArray.splice(key);
		}
	}

	// 	REMOVING LEADING BLANK ROWS
	for (let key in nJArray) {
		if (nJArray[key].f2 == "") {
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
			if (nJArray[rowIndex].f8 == "D") {
				if (nTreePath == "") {
					nTreePath = `${nJArray[rowIndex].f2}|${nJArray[rowIndex].f5}`;
					nParentKey = nJArray[rowIndex].f3;

					let parentKey = getParentKey(nJArray[rowIndex].f4, oJArray);
					nJArray[rowIndex].f4 = nJArray[parentKey].f3;
				} else if (nJArray[rowIndex].f2.toString().includes(nTreePath)) {
					nJArray[rowIndex].f4 = nParentKey;
					nJArray[rowIndex].f5 = "&nbsp;";
				} else {
					nTreePath = `${nJArray[rowIndex].f2}|${nJArray[rowIndex].f5}`;
					nParentKey = nJArray[rowIndex].f3;

					let parentKey = getParentKey(nJArray[rowIndex].f4, oJArray);
					nJArray[rowIndex].f4 = nJArray[parentKey].f3;
				}
			}

			if (oJArray[rowIndex].f8 == "A") {
				if (oTreePath == "") {
					oTreePath = `${oJArray[rowIndex].f2}|${oJArray[rowIndex].f5}`;
					oParentKey = oJArray[rowIndex].f3;

					let parentKey = getParentKey(oJArray[rowIndex].f4, nJArray);
					oJArray[rowIndex].f4 = oJArray[parentKey].f3;
				} else if (oJArray[rowIndex].f2.toString().includes(oTreePath)) {
					oJArray[rowIndex].f4 = oParentKey;
					oJArray[rowIndex].f5 = "&nbsp;";
				} else {
					oTreePath = `${oJArray[rowIndex].f2}|${oJArray[rowIndex].f5}`;
					oParentKey = oJArray[rowIndex].f3;

					let parentKey = getParentKey(oJArray[rowIndex].f4, nJArray);
					oJArray[rowIndex].f4 = oJArray[parentKey].f3;
				}
			}
		}
	}

	// REMOVE CHILD NODES IF PARENT STATUS IS D or A
	for (let i = 0; i < nJArray.length; i++) {
		if (nJArray[i].f8 == 'D' || nJArray[i].f8 == 'A') {
			let f2: string = nJArray[i].f2 + '|' + nJArray[i].f5;
			for (let j = i + 1; j < nJArray.length; j++) {
				if (nJArray[j].f2.startsWith(f2)) {
					nJArray.splice(j, 1);
					j--;
				}
				else {
					i = j - 1;
					break;
				}
			}
		}
	}

	// REMOVE CHILD NODES IF PARENT STATUS IS D or A
	for (let i = 0; i < oJArray.length; i++) {
		if (oJArray[i].f8 == 'D' || oJArray[i].f8 == 'A') {
			let f2: string = oJArray[i].f2 + '|' + oJArray[i].f5;
			for (let j = i + 1; j < oJArray.length; j++) {
				if (oJArray[j].f2.startsWith(f2)) {
					oJArray.splice(j, 1);
					j--;
				}
				else {
					i = j - 1;
					break;
				}
			}
		}
	}


	try {
		fs.writeFileSync(nfName, JSON.stringify(nJArray), "utf8");
		fs.writeFileSync(ofName, JSON.stringify(oJArray), "utf8");
	} catch (err) {
		vscode.window.showErrorMessage(
			"addExtraRows - Unable to save data. " + err
		);
	}
}


function getParentKey(currentKey: number, data: any) {
	let finalKey: number = 0;
	for (let key in data) {
		if (data[key].f3 == currentKey) {
			finalKey = data[key].f0;
			break;
		}
	}

	return finalKey;
}

function insertDummyRows(
	jsonNode: any,
	rowIndex: number,
	SCREEN_NAME: string,
	TREE_PATH: string,
	PARENT_KEY: number,
	CHILD_KEY: number,
	PROP_NAME: string,
	DIFF_FOUND: string
) {
	let json = JSON.parse(
		`{"f0":${0}, "f1":"${SCREEN_NAME}", "f2":"${TREE_PATH}","f3":${PARENT_KEY},"f4":${CHILD_KEY},"f5":"${PROP_NAME}","f6":"","f7":"Y","f8":"${DIFF_FOUND}"}`
	);
	jsonNode.splice(rowIndex, 0, json);
}

function readJsonFile(
	jFinalData: any,
	data: any,
	foldername: string,
	filename: string,
	sequence: any
) {
	let screenName: string = data.TopParent.Name;
	let tempseq = sequence.No++;
	let actualFileName: string = "";

	if (foldername.lastIndexOf("\\") != -1) {
		actualFileName = foldername.substring(foldername.lastIndexOf("\\") + 1);
	} else {
		actualFileName = foldername.substring(foldername.lastIndexOf("/") + 1);
	}

	addDataToJson(
		jFinalData,
		screenName,
		screenName,
		tempseq,
		-1,
		`${screenName} - ${actualFileName}`,
		screenName,
		"N",
		"N"
	);
	if (
		readAllProperties(
			data.TopParent,
			screenName,
			tempseq,
			screenName,
			jFinalData,
			sequence
		)
	) {
		try {
			fs.writeFileSync(
				path.join(foldername, filename + ".json"),
				`[${jFinalData}]`,
				"utf8"
			);
		} catch (err) {
			vscode.window.showErrorMessage("Unable to save data. " + err);
		}
	}
}

function readAllProperties(
	jdata: any,
	treePath: string,
	childKey: number,
	screenName: string,
	jFinalData: any,
	sequence: any
) {
	let currentParentKey: number;

	try {
		for (let key in jdata) {
			let tdata: any = jdata[key];

			if (Array.isArray(tdata)) {
				currentParentKey = sequence.No++;

				addDataToJson(
					jFinalData,
					screenName,
					treePath,
					currentParentKey,
					childKey,
					key,
					key,
					"N",
					"N"
				);
				let parentArrayKey: number = currentParentKey;
				let arrayProcessed: Boolean = false;
				let props: string = "";
				for (let index = 0; index < tdata.length; index++) {
					if (typeof tdata[index] === "object") {
						arrayProcessed = true;
						if (key == "Rules") {
							let oJData: any = tdata[index];
							let props: string = "";
							for (let ckey in oJData) {
								props += `${ckey}: ${oJData[ckey]}|`;
							}

							currentParentKey = sequence.No++;
							addDataToJson(
								jFinalData,
								screenName,
								treePath + "|" + key + "|" + oJData.Property,
								currentParentKey,
								parentArrayKey,
								oJData.Property,
								props,
								"N",
								"N"
							);
						} else if (key == "ControlPropertyState") {
							let tempArrChildKey: number = sequence.No++;
							let oJData: any = tdata[index];

							let props: string = "";
							for (let ckey in oJData) {
								props += `${ckey}: ${oJData[ckey]}|`;
							}

							currentParentKey = sequence.No++;
						} else if (key == "Children") {
							let tempArrChildKey: number = sequence.No++;
							let oJData: any = tdata[index];

							addDataToJson(
								jFinalData,
								screenName,
								treePath + "|" + key,
								tempArrChildKey,
								parentArrayKey,
								oJData.Name,
								oJData.Name,
								"N",
								"N"
							);

							let containsData: Boolean = false;
							for (let tk in oJData) {
								containsData = true;
								break;
							}

							if (containsData) {
								readAllProperties(
									oJData,
									treePath + "|" + key + "|" + oJData.Name,
									tempArrChildKey,
									screenName,
									jFinalData,
									sequence
								);
							}
						} else {
							currentParentKey = sequence.No++;
							addDataToJson(
								jFinalData,
								screenName,
								treePath,
								currentParentKey,
								childKey,
								key,
								key,
								"N",
								"N"
							);

							let oJData: any = tdata[index];
							let containsData: Boolean = false;
							for (let tk in oJData) {
								containsData = true;
								break;
							}

							if (containsData) {
								readAllProperties(
									oJData,
									treePath + "|" + key,
									currentParentKey,
									screenName,
									jFinalData,
									sequence
								);
							}
						}
					} else {
						// this shud be else if jvalue
						props += `${tdata[index]}|`;
					}
				}

				if (!arrayProcessed) {
					currentParentKey = sequence.No++;
					addDataToJson(
						jFinalData,
						screenName,
						treePath + "|" + key,
						currentParentKey,
						parentArrayKey,
						key,
						props,
						"N",
						"N"
					);
				}
			}
			// OBJECT containing json data
			else if (typeof tdata === "object") {
				currentParentKey = sequence.No++;
				addDataToJson(
					jFinalData,
					screenName,
					treePath,
					currentParentKey,
					childKey,
					key,
					key,
					"N",
					"N"
				);

				let props: string = "";
				for (let ckey in tdata) {
					if (typeof tdata[ckey] === "object") {
						let containsData = false;
						for (let k in tdata[ckey]) {
							containsData = true;
							props += `${k}: ${tdata[ckey][k]}|`;
						}

						if (!containsData) {
							props += `${ckey}:}|`;
						}
					} else {
						props += `${ckey}: ${tdata[ckey]}|`;
					}
				}

				if (props != "") {
					let tempArrChildKey = sequence.No++;
					addDataToJson(
						jFinalData,
						screenName,
						treePath + "|" + key,
						tempArrChildKey,
						currentParentKey,
						key,
						props,
						"N",
						"N"
					);
				}
			}
			// key:Value pair
			else {
				currentParentKey = sequence.No++;
				addDataToJson(
					jFinalData,
					screenName,
					treePath,
					currentParentKey,
					childKey,
					key,
					tdata,
					"N",
					"N"
				);
			}
		}
	} catch (err) {
		vscode.window.showErrorMessage(
			"Error while reading all properties. " + err
		);
		return false;
	}
	return true;
}

function deleteTempFiles(conditional: Boolean) {
	let oFiles: string[] = fs.readdirSync(tempFolderList[0], "utf8");
	let nFiles: string[] = fs.readdirSync(tempFolderList[1], "utf8");

	oFiles.forEach(function (file: string) {
		if (conditional) {
			if (file.endsWith("json")) {
				fs.unlink(path.join(tempFolderList[0], file), function (err: any) {
					if (err) throw err;
				});
			}
		} else {
			fs.unlink(path.join(tempFolderList[0], file), function (err: any) {
				if (err) throw err;
			});
		}
	});

	nFiles.forEach(function (file: string) {
		if (conditional) {
			if (file.endsWith("json")) {
				fs.unlink(path.join(tempFolderList[1], file), function (err: any) {
					if (err) throw err;
				});
			}
		} else {
			fs.unlink(path.join(tempFolderList[1], file), function (err: any) {
				if (err) throw err;
			});
		}
	});
}

const removeDirRecursive = function (path: string) {
	if (fs.existsSync(path)) {
		const files = fs.readdirSync(path);

		if (files.length > 0) {
			files.forEach(function (filename: string) {
				if (fs.statSync(path + "/" + filename).isDirectory()) {
					removeDirRecursive(path + "/" + filename);
				} else {
					fs.unlinkSync(path + "/" + filename);
				}
			});
			fs.rmdirSync(path);
		} else {
			fs.rmdirSync(path);
		}
	}
};

function addDataToJson(jsonNode: any, SCREEN_NAME: string, TREE_PATH: string, PARENT_KEY: number, CHILD_KEY: number, PROP_NAME: string, PROP_VALUE: string, COMPARED: string, DIFF_FOUND: string) {
	var VALUE = escape(PROP_VALUE);
	jsonNode.push(
		`{"f0":${0}, "f1":"${SCREEN_NAME}", "f2":"${TREE_PATH}","f3":${PARENT_KEY},"f4":${CHILD_KEY},"f5":"${PROP_NAME}","f6":"${VALUE}","f7":"${COMPARED}","f8":"${DIFF_FOUND}"}`
	);
}

function updateRowIndex(ofName: string, nfName: string) {
	let oJData = JSON.parse(fs.readFileSync(ofName, "utf8"));
	let nJData = JSON.parse(fs.readFileSync(nfName, "utf8"));

	for (let key in oJData) {
		oJData[key].f0 = Number.parseInt(key);
	}

	try {
		fs.writeFileSync(ofName, JSON.stringify(oJData), "utf8");
	} catch (err) {
		vscode.window.showErrorMessage("Unable to save data. " + err);
	}

	for (let key in nJData) {
		nJData[key].f0 = Number.parseInt(key);
	}

	try {
		fs.writeFileSync(nfName, JSON.stringify(nJData), "utf8");
	} catch (err) {
		vscode.window.showErrorMessage("Unable to save data. " + err);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
	try {
		removeDirRecursive(tempFolder);
	} catch (err) {
		throw err;
	}
}
