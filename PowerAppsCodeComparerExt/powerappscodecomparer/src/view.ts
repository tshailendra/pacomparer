import * as vscode from 'vscode';

const fs = require("fs");
const path = require("path");

var createHTML = function (tempFolderList: string[]) {

    try {
        initiateHTMLFileGen('o', tempFolderList[0]);
        initiateHTMLFileGen('n', tempFolderList[1]);
    }
    catch (err) {
        throw err;
        return false;
    }

    return true;
}


function initiateHTMLFileGen(prefix: string, folderLocation: string) {

    let fileList: string[] = fs.readdirSync(folderLocation, 'utf8');

    fileList.forEach(function (file: string) {
        if (file.startsWith(prefix)) {
            let jData = JSON.parse(fs.readFileSync(path.join(folderLocation, file), 'utf8'));
            let html: any = { text: '' }

            html.text += `<table class="main" width="100%" align="center" cellspacing="1" style=" background-color:black; table-layout: fixed;">`;
            html.text += `<tr name="${(jData[0].f0) - 1}" onclick='rowstatus("${jData[0].f0}")'><td class="pk screen" colspan="2">${jData[0].f5}</td></tr>`;
            let childElements = jData.filter((item: any) => item.f4 == jData[0].f3);
            if (childElements.length > 0) {
                html.text += `<tr name="${jData[0].f0}" class="trshow"><td class="trshow" colspan="2">`;
                generateHTMLTags(jData, childElements, jData[0].f3, html); // first key value
                html.text += `</td></tr>`;
            }
            html.text += `</table>`;

            if (prefix == 'o') {
                let count: number = 0;

                for (let key in jData) {
                    if (jData[key].f8 == 'D') {
                        count++;
                    }
                }

                html.text += `<span id='delcount' style='visibility: hidden' data-delcount='${count}' />`;

                count = 0;
                for (let key in jData) {
                    if (jData[key].f8 == 'Y') {
                        count++;
                    }
                }

                html.text += `<span id='diffcount' style='visibility: hidden' data-diffcount='${count}' />`;

            }
            else if (prefix = 'n') {
                let count: number = 0;
                for (let key in jData) {
                    if (jData[key].f8 == 'A') {
                        count++;
                    }
                }

                html.text += `<span id='addcount' style='visibility: hidden' data-addcount='${count}' />`;

            }

            fs.writeFileSync(path.join(folderLocation, `${prefix}${jData[0].f1}.html`), html.text, 'utf8');
        }
    });
}

function generateHTMLTags(jMainData: any, jChildData: any, primaryKey: any, html: any) {

    html.text += `<table class="main" width="99%" align="right" cellspacing="1" style="background-color: black; table-layout: fixed;">`;
    for (let key in jChildData) {
        let childElements = jMainData.filter((item: any) => item.f4 == jChildData[key].f3);
        if (childElements.length > 0) {
            html.text += `<tr name="${(jChildData[key].f0) - 1}" onclick='rowstatus("${jChildData[key].f0}")'><td width="220" class="pk" colspan="2">${jChildData[key].f5}</td></tr>`;
            html.text += `<tr name="${jChildData[key].f0}" class="trshow"><td class="trshow" colspan="2">`;
            generateHTMLTags(jMainData, childElements, jChildData[key].f3, html); // first key value
            html.text += `</td></tr>`;
        } else {
            let value: string = unescape(jChildData[key].f6);
            html.text += `<tr name="${jChildData[key].f0}" ondblclick='dc(this)'><td width="220" class='${jChildData[key].f8}' data-f2="${jChildData[key].f2}">${jChildData[key].f5}</td><td class='value ${jChildData[key].f8}'>${value}</td></tr>`;
        }
    }
    html.text += `</table>`;
}

var getHTML = function (htmlFile: string) {
    return fs.readFileSync(htmlFile, 'utf8');
}

var getScreenNames = function (prefix: string, folderPath: string) {
    let screenList = new Array();
    let oFiles: string[] = fs.readdirSync(folderPath, 'utf8');
    try {
        for (let idx = 0; idx < oFiles.length; idx++) {
            if (oFiles[idx].startsWith(prefix) && oFiles[idx].indexOf('html') >= 0) {
                screenList.push(oFiles[idx].toString().substring(1));
            }
        }
    } catch (err) {
        screenList = [];
    }

    return screenList;
}

module.exports = { createHTML, getHTML, getScreenNames };
