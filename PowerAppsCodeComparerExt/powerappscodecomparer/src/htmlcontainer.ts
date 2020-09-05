import * as vscode from "vscode";
const meta = require('../package.json');

var css = function (data1: string, screenList: any, selectedScreen: string) {

    let dropdown: string = `<select style="height: 28px;" id="screennames" onchange="screenchange()"><option value=""></option>`;
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

    let htmlcontent = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
</head>
<body>
<style>
html, body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; height: 100%; width:99%; overflow:hidden; margin: 0px;}
.flex-topbottom { display: flex; flex-direction: column; width: 98%; margin: 0px; height: 95%; }
.flex-toponly { line-height: 30px; width: 100%; border-bottom: 1px solid #808080; }
.flex-bottomonly { height: 98%; width: 100%; background-color: white; }

#header{ margin: 4px; background-color: skyblue; border: 1px solid skyblue; color: white; border-radius: 5px; width: 99%; padding: 10px; }
.container { width: 100%; height: 98%; margin:-2px; }
.treetablescroll{ overflow: scroll; height: 100%; width: 100%; }
.treetable { table-layout: fixed; width: 100%; height: 100%; border-collapse: collapse; }
.treetable th { color: #333; text-align: center; padding: 10px 0; background: #fafafa; font-size: 13px; border: 1px solid #f1f1f1; }
.treetable td { border: 1px solid #f1f1f1; font-size: 14px; color: black; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
td.property{ padding-left: 10px; }
.treetable tr td:first-child { overflow: initial; }
.treetable tr:hover{  background-color: #fffef0; }
.tdspan { border: 1px solid transparent; display: inline-block; width: 20px; height: 20px; line-height: 18px; text-align: center; vertical-align: top; font-size: 19px; position: relative; box-sizing: border-box; margin-top: 4px; border-radius: 50%; }
.treetable tr td .tdspan:first-child { margin-left: -10px; }
.tdspan.btntoggle { border: 1px solid #d9d9d9; position: relative; cursor: pointer; width: 22px; height: 22px; z-index: 15; background-color: whitesmoke;}
.tdspan.btntoggle.is-close { background: #f1f1f1; border: 1px solid transparent; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
.tdspan:before { position: absolute; content: ""; width: 1px; height: 34px;background: black; left: 51%; top: -25px; z-index: 8; }
.tdspan.last:after { position: absolute; content: ""; width: 18px; height: 1px; background: black; top: 50%; margin-top: -1px; left: -10px; }
.tdspan p { display: block; width: 5px; height: 5px; margin-left: 8px; margin-top: 6px; background: #4d4c4c; border-radius: 50%; }
.tdspan.last:before { display: none; }
.tdspan.btntoggle:after { display: none; }
.tdspan.btntoggle:before { display: none; }
#treedata td { cursor: pointer;  }
.treetable tr td .tdspan:first-child:after { display: none; }
.spcontent { display: inline-block; padding: 7px; }

.D { background-color: lightcoral; z-index: -3; border: 1px solid lightcoral; }
.A { background-color: darkseagreen;z-index: -3; border: 1px solid darkseagreen; }
.Y { background-color: gainsboro; z-index: -3;border: 1px solid gainsboro; }
 
.c1 { display: none; }
.c2 { display: none; }

.main tr { background-color: white; cursor: pointer;  line-height: 25px; }
.screen { background-color: blueviolet; font-weight: bold; color: white; font-size: 14px }
.value { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.modal { display: none;  position: fixed; z-index: 20; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); }
.mcontent { position: relative; background-color: #fefefe; margin: auto; padding: 0; border: 1px solid #888; width: 80%; box-shadow: 0 4px 8px 0 rgba(150,150,0,0.6),0 6px 20px 0 rgba(150,150,0,0.19); }
.header { font-size: 20px; font-weight: bold; color: blue; }
.header2 { margin:20px; font-size: 18px;  font-weight: bold; }
.exit { color: red; float: right; }
.exit:hover, .exit:focus { color: red; text-decoration: none; cursor: pointer; }
.mbody { padding: 2px 8px;}

.setting { line-height: 12px; padding: 5px; border-radius: 10px; border-bottom-right-radius: 0px; border-top-right-radius: 0px; display: inline-block; width: 80px; text-align: center; }
.countsetting { vertical-align: central; line-height: 8px; padding: 5px; border-radius: 10px; border-bottom-left-radius: 0px; border-top-left-radius: 0px; display: inline-block; width: 30px; text-align: center; background-color: white; }
.selectedrow { background-color: aquamarine; }
 
.version { text-align: right; margin: auto; width: 99%; font-style: italic; color: #c4c4c4; }
.countermain { border-collapse: collapse; table-layout: fixed; line-height: 8px; }
.countermain tr.outer { border: 0px solid;}
.countdescription { margin: 0px; margin-left: -4px; margin-right: -4px; padding: 10px; display: inline-block; width: 80px; text-align: center; }
.spinner { width: 10px;}
.spinner span { cursor: pointer; font-size: .6em; padding-left: 4px; padding-right: 4px; margin-top:-1px; margin-left: -5px; margin-right: 10px; }
span.up { cursor: pointer; font-size: 1.6em; padding-left: 7px; padding-right: 4px; border-top: 1px solid gainsboro; position: fixed; margin-left: 4px; padding-top: 3px; padding-top: 1px;}
span.down { cursor: pointer; font-size: 1.6em; padding-left: 7px; padding-right: 4px; border-bottom: 1px solid gainsboro; position: fixed; margin-top: -2px; margin-left: 4px; padding-bottom: 4px;}

.totalcount { padding: 8px; border-radius: 10px 0 0 10px; display: inline-block; width: 30px; background-color: white; text-align: right; }
.finder { border-left: 0px solid white; padding: 7px; border-radius: 0 10px 10px 0; display: inline-block; width: 4px; background-color: white; margin: -2px; padding: 7px 8px 8px 8px; }
.differences { margin: -4px; padding: 8px; margin-right: -6px; margin-left: -4px; display: inline-block; width: 80px; text-align: center; }

.deleted { border-color: lightcoral !important; }
.added { border-color: darkseagreen !important; }
.diff { border-color: gainsboro !important; }

.delcolor { color: lightcoral; }
.addcolor { color: darkseagreen; }
.diffcolor { color: gainsboro; }


</style>

<div class="flex-topbottom">
<div class="flex-toponly">
<table width="100%">
<tr>
<td width="38%">&nbsp;</td>
<td align="right">
<table class="countermain" align="right">
<tr>
<td width="1px" rowspan="2"><span class="Y totalcount" id="totDiff"></span></td>
<td width="1px" rowspan="2"><span id="differences" class="Y differences">Differences</span></td>
<td class="spinner"><span><span id="updiff" class="up diff diffcolor">&#9650;</span></span></td>
<td width="1px" rowspan="2"><span class="Y finder diff">&nbsp;</span></td>
</tr>
<tr>
<td class="spinner"><span><span id="downdiff" class="down diff diffcolor">&#9660;</span></span></td>
</tr>
</table>
</td>

<td align="right">
<table class="countermain" align="right">
<tr>
<td width="1px" rowspan="2"><span class="D totalcount" id="totDel"></span></td>
<td width="1px" rowspan="2"><span id="deleted" class="D differences">Deleted</span></td>
<td class="spinner"><span><span id="updeleted" class="up deleted delcolor">&#9650;</span></span></td>
<td width="1px" rowspan="2"><span class="Y finder deleted">&nbsp;</span></td>
</tr>
<tr>
<td class="spinner"><span><span id="downdeleted" class="down deleted delcolor">&#9660;</span></span></td>
</tr>
</table>
</td>

<td align="right">
<table class="countermain">
<tr>
<td width="1px" rowspan="2"><span class="A totalcount" id="totAdd"></span></td>
<td width="1px" rowspan="2"><span id="added" class="A differences">Added</span></td>
<td class="spinner"><span><span id="upadded" class="up added addcolor">&#9650;</span></span></td>
<td width="1px" rowspan="2"><span class="Y finder added">&nbsp;</span></td>
</tr>
<tr>
<td class="spinner"><span><span id="downadded" class="down added addcolor">&#9660;</span></span></td>
</tr>
</table>
</td>

<td width="20%" align="right">
<span id="status"></span> Screen: ${dropdown}</td></tr></table>
</div>

<div class="flex-bottomonly">
<table class="treetable"  align="center">
<thead>
<tr><th width="20%" style="border-left: 1px solid black;">Controls</th><th width="39%"><span id="oversion"></span></th><th width="41%"><span id="nversion"></span></th></tr>
</thead>
</table>
<div class="container">
<div id="treedata" class="treetablescroll">
    <table class="treetable" align="center">
    ${data1}
    </table>
</div>
<div class="version"><span id="ver"></span></div>
</div></div>

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
</div></div></div></div>

<script type="text/javascript">
var selRow;
var version = "v${meta.version}";
const vscode = acquireVsCodeApi();
const status = document.getElementById('status');
const modal = document.getElementById("myModal");
var idx = 0;
var data;

$( document ).ready(function() {

    $("#oversion").text($("#v1").text()); // value updated in view.ts
    $("#nversion").text($("#v2").text()); // value updated in view.ts
    $("#ver").text(version);
    $("#totAdd").text($("#addcount").attr('data-addcount'));
    $("#totDel").text($("#delcount").attr('data-delcount'));
    $("#totDiff").text($("#diffcount").attr('data-diffcount'));

    data = JSON.parse($("#changeids").attr('data-rows'));

    $(document.body).delegate('.expand','click',function() {
        var state = $(this).text();
        var refpath = $(this).attr('data-refpath');
        if(state== "-"){
            $("tr[name^='" + refpath + "']").hide();
            $(this).text("+");
        }
        else{
            $("tr[name^='" + refpath + "']").show();
            $(this).text("-");
        }
    });

    $("#updiff").click(function() { if (parseInt($("#totDiff").text()) > 0) { scrolltoposition("Y"); } });

    $("#downdiff").click(function() { if (parseInt($("#totDiff").text()) > 0) { scrolltoposition("Y"); } });

    $("#updeleted").click(function() { if (parseInt($("#totDel").text()) > 0) { scrolltoposition("D"); } });

    $("#downdeleted").click(function() { if (parseInt($("#totDel").text()) > 0) { scrolltoposition("D"); } });

    $("#upadded").click(function() { if (parseInt($("#totAdd").text()) > 0) { scrolltoposition("A"); } });

    $("#downadded").click(function() { if (parseInt($("#totAdd").text()) > 0) { scrolltoposition("A"); } });

    $("#treedata tr").dblclick(function() {
        modal.style.display = "block";
        $("#idtreepath").text($(this).find('td span.spcontent').attr('title'));
        $("#opname").text($(this).find('td span.spcontent').text());
        $("#npname").text($(this).find('td span.spcontent').text());

        $("#opvalue").html($(this).find('td')[1].innerText.split('|').join('<br>'));
        $("#npvalue").html($(this).find('td')[2].innerText.split('|').join('<br>'));

        selRow = this;
        $(this).addClass('selectedrow');
    });
});

    function scrolltoposition(dtype) {
    // search and expand all nodes 
        var nodes = $("#treedata").find("tr span.expand:contains('+')");
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent == "+") {
                console.log(nodes[i].getAttribute('data-refpath'));
                let refpath = nodes[i].getAttribute('data-refpath');
                $("tr[name^='" + refpath + "']").show();
                nodes[i].textContent = "-";
            }
        }

        var rowid = 0;
        var check = 0;
        var i = idx;
        while (true) {

        if (data[i].t == dtype) { rowid = data[i].v; idx = i + 1; break; }
            i++;
            if (i > data.length - 1) {i = 0; check++;}
            
            //force break;
            if (check > 3) { break; }
        }

        if (rowid != 0) {
            var container = $("#treedata");
            var scrollTo = $('#' + rowid);

            container.animate({
                scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
            });
        }
}

function exitModal() {
    modal.style.display = "none";
    selRow.classList.remove('selectedrow');
}

function screenchange(){
    vscode.postMessage({
        command: 'screenchange',
        text: document.getElementById("screennames").value
    });
}

function setScreenName(){
    var ctrl = document.getElementById("screennames");
    if(ctrl.options.length>0){ ctrl.selectedIndex = 0; }
}

</script>

</body>
</html>`;

    return htmlcontent;

}

module.exports = css;