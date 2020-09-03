import * as vscode from 'vscode';

const fs = require("fs");
const path = require("path");

var createHTML = function (tempFolderList: string[], tempFolder: string) {

    try {
        initHTML(tempFolderList[0], tempFolderList[1], tempFolder);
    }
    catch (err) {
        throw err;
        return false;
    }

    return true;
}

function initHTML(ofolderLocation: string, nfolderLocation: string, tempFolder: string) {

    let ofileList: string[] = fs.readdirSync(ofolderLocation, 'utf8');
    let nfileList: string[] = fs.readdirSync(nfolderLocation, 'utf8');
    let fileList: any = [];

    ofileList.forEach(function (ofile: string) {
        if (ofile.startsWith('o')) {
            nfileList.forEach(function (nfile: string) {
                if (nfile.startsWith('n')) {
                    if (ofile.substr(1) == nfile.substr(1)) {
                        fileList.push([ofile, nfile]);
                    }
                }
            });
        }
    });

    for (let i = 0; i < fileList.length; i++) {
        let ojData = JSON.parse(fs.readFileSync(path.join(ofolderLocation, fileList[i][0]), 'utf8'));
        let njData = JSON.parse(fs.readFileSync(path.join(nfolderLocation, fileList[i][1]), 'utf8'));

        let loc: any;
        let v1: string = "";
        let v2: string = "";
        
        if (ofolderLocation.includes('/')) {
            loc = ofolderLocation.split('/');
            v1 = loc[loc.length - 1];

            loc = nfolderLocation.split('/');
            v2 = loc[loc.length - 1];
        }
        else {
            loc = ofolderLocation.split('\\');
            v1 = loc[loc.length - 1];

            loc = nfolderLocation.split('\\');
            v2 = loc[loc.length - 1];
        }
        
        let html: any = { text: '' }


        html.text = `<tbody id="treedata">`;
        html.text += `<tr><td width="20%"></td><td width="40%"></td><td width="40%"></td></tr>`;
        let ochildElements = ojData.filter((item: any) => item.f4 == ojData[0].f3);
        let nchildElements = njData.filter((item: any) => item.f4 == njData[0].f3);

        if (ochildElements.length > 0 && nchildElements.length > 0) {
            generateTree(ojData, ochildElements, njData, nchildElements, ojData[0].f3, ojData[0].f2, 3, html); // first key value
        }
        
        html.text += `<tr style="height: 0px; visibility: hidden"><td width="20%"></td><td width="40%"></td><td width="40%">`;
        let count: number = 0;
        for (let key in ojData) {
            if (ojData[key].f8 == 'D') {
                count++;
            }
        }
        html.text += `<span id='delcount' style='visibility: hidden' data-delcount='${count}'></span>`;

        count = 0;
        for (let key in ojData) {
            if (ojData[key].f8 == 'Y') {
                count++;
            }
        }
        html.text += `<span id='diffcount' style='visibility: hidden' data-diffcount='${count}'></span>`;

        count = 0;
        for (let key in njData) {
            if (njData[key].f8 == 'A') {
                count++;
            }
        }
        html.text += `<span id='addcount' style='visibility: hidden' data-addcount='${count}'></span>`;
        html.text += `<span style="visibility:hidden" id="v1">${v1}</span>`;
        html.text += `<span style="visibility:hidden" id="v2">${v2}</span>`;
        html.text += `</td></tr>`;
        html.text += `</tbody>`;
        fs.writeFileSync(path.join(tempFolder, `${ojData[0].f1}.html`), html.text, 'utf8');
    }
}

function generateTree(ojMainData: any, ojChildData: any, njMainData: any, njChildData: any, primaryKeyPath: string, treepath: string, spanCount: number, html: any) {

    let ochildElements: any;
    let nchildElements: any;

    let spcount: number = spanCount;
    for (let key in ojChildData) {

        if (!(ojChildData[key] == undefined)) {
            ochildElements = ojMainData.filter((item: any) => item.f4 == ojChildData[key].f3);
        }

        if (!(njChildData[key] == undefined)) {
            nchildElements = njMainData.filter((item: any) => item.f4 == njChildData[key].f3);
        }

        if ((ochildElements != null && ochildElements.length > 0) || (nchildElements != null && nchildElements.length > 0)) {

            let nvalue: string = "";
            let ovalue: string = "";

            let property: string = "";
            let treepath: string = "";
            let difference: string = "";
            let keyPath: string = "";
            let fk: string = "";

            if (!(njChildData[key] == undefined)) {
                nvalue = unescape(njChildData[key].f6);
                difference = njChildData[key].f8;
                fk = njChildData[key].f4;

                keyPath = primaryKeyPath + "_" + njChildData[key].f3;
                property = njChildData[key].f5;
                treepath = njChildData[key].f2 + '|' + njChildData[key].f5;

            }

            if (!(ojChildData[key] == undefined)) {
                ovalue = unescape(ojChildData[key].f6);
                difference = ojChildData[key].f8;
                fk = ojChildData[key].f4;

                keyPath = primaryKeyPath + "_" + ojChildData[key].f3;
                property = ojChildData[key].f5;
                treepath = ojChildData[key].f2 + '|' + ojChildData[key].f5;
            }

            html.text += createTreeTags(spcount, keyPath, primaryKeyPath, property, treepath, 'btntoggle', ovalue, nvalue, difference);
            generateTree(ojMainData, ochildElements, njMainData, nchildElements, keyPath, treepath, spcount + 1, html); // first key value

        } else {

            let nvalue: string = "";
            let ovalue: string = "";

            let property: string = "";
            let difference: string = "";
            let refPath: string = "";

            if (!(njChildData[key] == undefined)) {
                nvalue = unescape(njChildData[key].f6);

                difference = njChildData[key].f8;
                refPath = njChildData[key].f3;
                property = njChildData[key].f5;
            }

            if (!(ojChildData[key] == undefined)) {
                ovalue = unescape(ojChildData[key].f6);

                if (ojChildData[key].f8 == "D") {
                    difference = ojChildData[key].f8;
                    refPath = ojChildData[key].f3;
                    property = ojChildData[key].f5;
                }
            }

            html.text += createTreeTags(spcount, refPath, primaryKeyPath, property, treepath, 'last', ovalue, nvalue, difference);
        }
    }
}

function createTreeTags(tagCount: number, refPath: string, keypath: string, property: string, treepath: string, classtag: string, ovalue: string, nvalue: string, difference: string) {
    let html: string = '';

    html += `<tr name="${keypath}"><td class="${difference}">`;
    for (let i = 0; i < tagCount; i++) {
        if (i == tagCount - 1) {
            html += `<span title="${treepath}" class="spcontent">${property}</span>`;
        }
        else if (i == tagCount - 2) {
            if (classtag == 'last') {
                html += `<span class="tdspan ${classtag}"><p></p></span>`;
            }
            else {
                html += `<span data-refpath="${refPath}" class="tdspan ${classtag} expand">-</span>`;
            }
        }
        else {
            html += `<span class="tdspan"><b></b></span>`;
        }
    }
    html += `</td><td class='property ${difference}'>${ovalue}</td><td class='property ${difference}'>${nvalue}</td></tr>`;

    return html;
}

var getHTML = function (htmlFile: string) {
    return fs.readFileSync(htmlFile, 'utf8');
}

var getScreenNames = function (folderPath: string) {
    let screenList = new Array();
    let files: string[] = fs.readdirSync(folderPath, 'utf8');
    try {
        for (let idx = 0; idx < files.length; idx++) {
            if (files[idx].indexOf('html') >= 0) {
                screenList.push(files[idx].toString());
            }
        }
    } catch (err) {
        screenList = [];
    }

    return screenList;
}

module.exports = { createHTML, getHTML, getScreenNames };
