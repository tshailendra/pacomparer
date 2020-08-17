var css = function (data1: string, data2: string, screenList: any, selectedScreen: string) {

    let dropdown: string = `<select id="screennames" onchange="screenchange()"><option value=""></option>`;
    if (screenList.length > 0) {
        for (let idx = 0; idx < screenList.length; idx++) {
            let text = screenList[idx].split('.');
            if (selectedScreen == screenList[idx]) {
                dropdown += `<option selected value="${screenList[idx]}">${text[0]}</option>`;
            }
            else {
                dropdown += `<option value="${screenList[idx]}">${text[0]}</option>`;
            }
        }
    }
    dropdown += `</select>`;

    let cssstring = `
<!DOCTYPE html>
<html>

<head>

</head>
<body>
<style>
html, body { height: 100%; margin: 0px; color: black; background-color: white;}
.flex-topbottom { display: flex; flex-direction: column; width: 100%; margin: 0px; height: 100%; }
.flex-toponly { line-height: 30px; width: 100%; border-bottom: 1px solid #808080; }
.flex-bottomonly { height: 95%; width: 100%; background-color: white; }
.flex-leftright { margin: 0px; display: flex; flex-direction: row; height: 100%; overflow: hidden; }
.flex-leftonly, .flex-rightonly { width: 50%; height: 100%; overflow: scroll; }
.flex-leftonly { border-right: 1px solid #808080; height: 100%; }
.flex-rightonly { border-left: 1px solid #808080; height: 100%; }
.c1 { display: none; }
.c2 { display: none; }
.pk { background-color: floralwhite;}
.pk:before { content: "\\2796"; font-size: 8px; color: #777; float: left; margin-left: 2px; margin-right: 7px; }
.active::before { content: "\\02795";  }
.main tr { background-color: white; cursor: pointer;  line-height: 25px; }
.screen { background-color: blueviolet; font-weight: bold; color: white; font-size: 14px }
.value { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.modal { display: none;  position: fixed; z-index: 1; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); }
.mcontent { position: relative; background-color: #fefefe; margin: auto; padding: 0; border: 1px solid #888; width: 80%; box-shadow: 0 4px 8px 0 rgba(150,150,0,0.6),0 6px 20px 0 rgba(150,150,0,0.19); }
.header { font-size: 20px; font-weight: bold; color: blue; }
.header2 { margin:20px; font-size: 18px;  font-weight: bold; }
.exit { color: red; float: right; }
.exit:hover, .exit:focus { color: red; text-decoration: none; cursor: pointer; }
.mbody { padding: 2px 8px;}

.D { background-color: lightcoral; border: 1px solid lightcoral; }
.A { background-color: darkseagreen; border: 1px solid darkseagreen; }
.Y { background-color: gainsboro; border: 1px solid gainsboro; }
.setting { line-height: 12px; padding: 5px; border-radius: 10px; border-bottom-right-radius: 0px; border-top-right-radius: 0px; display: inline-block; width: 80px; text-align: center; }
.countsetting { vertical-align: central; line-height: 8px; padding: 5px; border-radius: 10px; border-bottom-left-radius: 0px; border-top-left-radius: 0px; display: inline-block; width: 30px; text-align: center; background-color: white; }
.selectedrow { background-color: aquamarine; }

</style>

<div class="flex-topbottom">
<div class="flex-toponly">
<table width="100%">
<tr>
<td width="20%">&nbsp;</td>
<td align="right">
<span class="Y setting">Differences</span><span class="Y setting countsetting" id="totDiff"></span>&nbsp;
<span class="D setting">Deleted</span><span class="D setting countsetting" id="totDel"></span>&nbsp;
<span class="A setting">Added:</span><span class="A setting countsetting" id="totAdd"></span>
</td>

<td width="20%" align="right">
<span id="status"></span> Screen: ${dropdown}</td></tr></table>
</div>
<div class="flex-bottomonly">
<div class="flex-leftright">
<div id="leftdiv" onscroll="leftdivscroll()" class="flex-leftonly">
${data1}
</div>
<div id="rightdiv" onscroll="rightdivscroll()" class="flex-rightonly">
${data2}
</div>
</div>
</div>
</div>

<div id="myModal" class="modal">
<div class="mcontent">
<div class="mbody">

<table width="100%">
    <tr><td valign="middle" class="header selectedrow" colspan="2"><span id="idtreepath">{TREE PATH}</span><span onclick="exitModal()" class="exit">&times;</span></td></tr>
    <tr><td>&nbsp;</td></tr>
    <tr class="header2"><td width="50%" id="opname">{PROPERTY_NAME 1}</td><td width="50%" id="npname">{PROPERTY_NAME 2}</td></tr>
</table>
<br>
<table width="100%">
    <tr><td width="1%">&nbsp;</td>
    <td width="49%" id="opvalue">{PROPERTY_VALUE 1}</td>
    <td width="1%">&nbsp;</td>
    <td width="49%" id="npvalue">{PROPERTY_VALUE 2}</td></tr>
</table>
<table width="100%">
<tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr>
</table>

</div>
</div>
</div>
</div>

<script type="text/javascript">
const vscode = acquireVsCodeApi();
const status = document.getElementById('status');
const modal = document.getElementById("myModal");

function screenchange(){
    vscode.postMessage({
        command: 'alert',
        text: document.getElementById("screennames").value
    });
}

function setScreenName(){
    var ctrl = document.getElementById("screennames");
    if(ctrl.options.length>0){ ctrl.selectedIndex = 0; }
}

function rowstatus(id) {

    var nodes = document.getElementsByName(id);
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].style.display == 'none') {
            nodes[i].style.display = "";
        }
        else {
            nodes[i].style.display = "none";
        }
    }

    nodes = document.getElementsByName(id - 1);
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].children[0].className.indexOf("pk")==0) {
            nodes[i].children[0].classList.toggle("active");
        }
    }
}

var leftdiv = document.getElementById('leftdiv');
var rightdiv = document.getElementById('rightdiv');

function leftdivscroll() {
    rightdiv.scrollTop = leftdiv.scrollTop;
}

function rightdivscroll() {
    leftdiv.scrollTop= rightdiv.scrollTop;
}

const idtreepath = document.getElementById("idtreepath");
const opname = document.getElementById("opname");
const opvalue = document.getElementById("opvalue");
const npname = document.getElementById("npname");
const npvalue = document.getElementById("npvalue");

let selectedrowleft1 = null;
let selectedrowleft2 = null;
let selectedrowright1 = null;
let selectedrowright2 = null;


function dc(r) {
    modal.style.display = "block";
    var rows = document.getElementsByName(r.getAttribute("name"));
    idtreepath.innerText = r.firstElementChild.dataset.f2;
    opname.innerText = rows[0].firstElementChild.innerText;
    opvalue.innerHTML = rows[0].lastElementChild.innerText.split('|').join('<br>');
    selectedrowleft1 = rows[0].firstElementChild;
    selectedrowleft2 = rows[0].lastElementChild;
    
    if (rows.length > 2) {
        npname.innerText = rows[2].firstElementChild.innerText;
        npvalue.innerHTML = rows[2].lastElementChild.innerText.split('|').join('<br>');

        selectedrowright1 = rows[2].firstElementChild;
        selectedrowright2 = rows[2].lastElementChild;

    }
    else {
        npname.innerText = rows[1].firstElementChild.innerText;
        npvalue.innerHTML = rows[1].lastElementChild.innerText.split('|').join('<br>');

        selectedrowright1 = rows[1].firstElementChild;
        selectedrowright2 = rows[1].lastElementChild;
    }

    selectedrowleft1.classList.add('selectedrow');
    selectedrowleft2.classList.add('selectedrow');
    selectedrowright1.classList.add('selectedrow');
    selectedrowright2.classList.add('selectedrow');
}

function exitModal() {
    modal.style.display = "none";

    selectedrowleft1.classList.remove('selectedrow');
    selectedrowleft2.classList.remove('selectedrow');
    selectedrowright1.classList.remove('selectedrow');
    selectedrowright2.classList.remove('selectedrow');

}

const idaddcount = document.getElementById('addcount');
const iddiffcount = document.getElementById('diffcount');
const iddelcount = document.getElementById('delcount');

const totAdd = document.getElementById('totAdd');
const totDel = document.getElementById('totDel');
const totDiff = document.getElementById('totDiff');

totAdd.innerText =  idaddcount.getAttribute('data-addcount');
totDel.innerText = iddelcount.getAttribute('data-delcount');
totDiff.innerText =  iddiffcount.getAttribute('data-diffcount');

</script>

</body>
</html>`;

    return cssstring;

}

module.exports = css;
