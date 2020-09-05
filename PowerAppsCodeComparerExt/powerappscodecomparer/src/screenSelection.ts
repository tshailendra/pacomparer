import * as vscode from "vscode";
const meta = require('../package.json');

var screenSel = function (message: string) {
    return html;
};

module.exports = { screenSel };

var html = `
<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Security-Policy">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <style>
        body { font-size: 13px;}
        td { background-color: white;line-height: 20px; padding: 3px;}
        .header { font-size: large; text-align: center; }
        .tblscreens { table-layout: fixed; background-color: grey; }
        .selheader { text-align: center; font-weight: bold; font-size: 13px; color: white; background-color: blueviolet; }
        .runheader { text-align: right; font-size: 17px; color: white; background-color: blueviolet; line-height: 35px; }
        .version { text-align: right; margin: auto;width:80%;font-style: italic;color: #c4c4c4; line-height: 25px;  }
        .selectedrow { background-color: beige; }
        .selexectype { background-color: beige; color: black; }
        .ui-button { width: 99%; height: 35px; font-size: 15px; background-color: lightgray; border-radius: 4px; }
        .selcompare { text-align:center; display:block; }

        #autorun { font-size: 17px; color: blueviolet; line-height: 10px; }
        #autorun li { padding-bottom: 10px; }

        #errmsg { color: red; font-size: 14px; }

    </style>
</head>

<body>

    <br><br>
    <div style="width: 100%;">
        <div class="version"><span id="ver"></span></div>
        <table width="80%" align="center" cellpadding="1" cellspacing="1" class="tblscreens">
            <thead>
            <tr class="runheader">
                <th width="58%">&nbsp;</th>
                <th id="exectype1" class="selexectype" align="center" width="15%"><label><input type="radio" name="exectype" checked value="1">Custom Run</label>
                </th>
                <th id="exectype2" align="center" width="15%"><label><input type="radio" name="exectype" value="2">Auto Run</label>
                </th>
                <th width="12%"><input id="btnExecute" type="button" class="ui-button" value="Execute">
                </th>
            </tr>
            </thead>
        </table>
        <br><br>
        <div id="error">
            <table width="80%" align="center" cellpadding="1" cellspacing="1">
                <tr><td>
                <span id="errmsg">ERROR HERE</span>
                </td></tr>
            </table>
        </div>
        <br><br>
        <div id="autorun">
        <table width="80%" align="center" cellpadding="1" cellspacing="1">
            <tr><td><ul>
            <li><b>Compares - </b>all matching screen names</li>
            <li><b>Ignores - </b>if screen names are different</li>
            <li>Click <b>Execute</b> to select files of different versions and process</li>
            </ul></td></tr>
        </table>
        </div>
        <div id="customrun">
            <table width="80%" align="center" cellpadding="1" cellspacing="1" class="tblscreens">
                <thead>
                    <tr class="selheader">
                        <th>&nbsp;</th>
                        <th width="12%" align="right">
                            <input id="btnShowScreens" type="button" class="ui-button" value="Show Screens">
                        </th>
                    </tr>
                </thead>
            </table>
            <table width="80%" align="center" cellpadding="1" cellspacing="1" class="tblscreens">
                <thead>
                    <tr class="selheader">
                        <th width="50%" class="header">Old Version</th>
                        <th width="50%" class="header">New Version</th>
                    </tr>
                </thead>
            </table>
            
            <table width="80%" align="center" cellpadding="1" cellspacing="1" class="tblscreens">
            <tr>
                <td width="38%"><span id="idoFileName">&nbsp;</span></td>
                <td width="12%"><input id="btnoFile" class="ui-button" type="button" value="Choose File"></td>
                <td width="38%"><span id="idnFileName">&nbsp;</span></td>
                <td width="12%"><input id="btnnFile" class="ui-button" type="button" value="Choose File"></td>
            </tr>

            <tr>
                <td colspan="2"><span id="idoFilePath">&nbsp;</span></td>
                <td colspan="2"><span id="idnFilePath">&nbsp;</span></td>
            </tr>
        </table>
            <br /><br />

            <div id="showresults">
            <table width="80%" align="center" cellpadding="3" cellspacing="1" class="tblscreens">
                <thead>
                    <tr class="selheader">
                        <th>&nbsp;</th>
                        <th width="12%" align="center">
                            <input id="btnCompareFiles" class="ui-button" type="button" value="Compare Files">
                        </th>
                    </tr>
                </thead>
            </table>

            <table id="tblCompareScreens" width="80%" align="center" cellpadding="3" cellspacing="1" class="tblscreens">
            <thead>
                <tr class="selheader">
                    <th width="5%">Select</th>
                    <th width="35%">Screen Name</th>
                    <th width="10%">Compare</th>
                    <th width="5%">Select</th>
                    <th width="35%">Screen Name</th>
                    <th width="10%">Compare</th>
                </tr>
            </thead>
        </table>

            <br /><br />
            <table id="tblDelScreens" width="80%" align="center" cellpadding="3" cellspacing="1" class="tblscreens">
                <thead>
                    <tr class="selheader">
                        <th>Deleted Screens</th>
                    </tr>
                </thead>
            </table>

            <br /><br />
            <table id="tblAddScreens" width="80%" align="center" cellpadding="3" cellspacing="1" class="tblscreens">
                <thead>
                    <tr class="selheader">
                        <th>Added Screens</th>
                    </tr>
                </thead>
            </table>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        var version = "v${meta.version}";

        $(document).ready(function() {
            // on load hide
            $("#btnExecute").prop('disabled',true);
            $("#btnShowScreens").prop('disabled',true);
            $("#showresults").hide();
            $("#autorun").hide();
            $("#error").hide();
            $("#ver").text(version);

            $("input[name='exectype']").click(function() {
                clearData();
                $('#idoFileName').html('&nbsp;');
                $('#idoFilePath').html('&nbsp;');
                $('#idnFileName').html('&nbsp;');
                $('#idnFilePath').html('&nbsp;');

                if ($("input[name='exectype']:checked").val() == 1) {
                    $("#btnExecute").prop('disabled',true);
                    $("#customrun").show();
                    $("#autorun").hide();
                    $('#exectype1').addClass('selexectype');
                    $('#exectype2').removeClass('selexectype');
                }
                else {
                    $("#btnExecute").prop('disabled',false);
                    $("#customrun").hide();
                    $("#autorun").show();
                    $('#exectype2').addClass('selexectype');
                    $('#exectype1').removeClass('selexectype');
                }
            });

            $("#btnoFile").click(function() {
                screenSelect(1,'old');
            });

            $("#btnnFile").click(function() {
                screenSelect(2,'new');
            });

            // sends msg to panel.webview.onDidReceiveMessage
            $("#btnShowScreens").click(function() {
                $("#error").hide();
                vscode.postMessage({
                    command: 'ShowScreens',
                    text: '[{"name":"' + $("#idoFileName").text() + '","path":"0"},' +
                        '{"name":"' + $("#idnFileName").text() + '","path":"1"}]'
                });
            });

            $("#btnExecute").click(function() {
                vscode.postMessage({
                    command: 'AutoRun',
                    text: ''
                });
            });

            $(document).on("click","#btnCompareFiles.ui-button",function() {

                var screens = "";
                $(".selcheck").each(function(index) {
                    if ($(this).is(':checked')) {
                        if (!screens.includes($(this).attr('data-name')))
                            screens += $(this).attr('data-name') + ",";
                    }
                });

                vscode.postMessage({
                    command: 'CompareFiles',
                    text: screens
                });
            });

            $(document).on("click","input.selcheck",function() {
                var idx = $(this).attr('data-id');
                var sel = this.checked;

                $("input.selcheck").each(function(index) {
                    if (idx == $(this).attr('data-id')) {
                        $(this).prop("checked",sel);
                    }
                });

                $("span.selcompare").each(function(index) {
                    if (idx == $(this).attr('data-id')) {
                        if (sel) {
                            $(this).text("Yes");
                            $(this).closest('tr').children('td,th').addClass('selectedrow');
                        } else {
                            $(this).text("No");
                            $(this).closest('tr').children('td,th').removeClass('selectedrow');
                        }
                    }
                });

                var atleastoneselected = false;
                $("#btnCompareFiles").prop('disabled',true);
                $("input.selcheck").each(function(index) {
                    if (this.checked) {
                        atleastoneselected = true;
                    }
                });

                if(atleastoneselected){
                    $("#btnCompareFiles").prop('disabled',false);
                }
            });
        });

        // sends msg to panel.webview.onDidReceiveMessage
        function screenSelect(index,cmd) {
            $("#error").hide();
            vscode.postMessage({
                command: cmd,
                text: index
            });
        }

        // receives msg from panel.webview.postMessage
        window.addEventListener('message',event => {
            const message = event.data;
            switch (message.index) {
                case -1:
                    $("#error").show();
                    $("#btnShowScreens").prop('disabled',false);
                    $("#showresults").hide();
                    $("#errmsg").html(message.error);
                    break;
                case 1:
                    clearData();
                    $('#idoFileName').text(message.filename);
                    $('#idoFilePath').text(message.filepath);
                    if($("#idoFilePath").text().length > 1 && $("#idnFilePath").text().length > 1 )
                    {
                        $("#btnShowScreens").prop('disabled',false);
                    }
                    break;
                case 2:
                    clearData();
                    $('#idnFileName').text(message.filename);
                    $('#idnFilePath').text(message.filepath);
                    if($("#idoFilePath").text().length > 1 && $("#idnFilePath").text().length > 1 )
                    {
                        $("#btnShowScreens").prop('disabled',false);
                    }
                    break;
                case 3:
                    var data = JSON.parse(message.filenames);
                    addData(data);
                    if(data.length > 0){
                        $("#showresults").show();
                    }
                    break;
            }
        });

        function clearData(){
            $(".nr").remove();
            $("#btnCompareFiles").prop('disabled',true);
            $("#btnShowScreens").prop('disabled',true);
            $("#showresults").hide();
        }

        function addData(data) {
            clearData();
            var tdata = "";
            for (var i = 0; i < data.length; i++) {

                if (data[i].oname != '' && data[i].nname != '') {
                    tdata = "<td style='text-align:center'><input type='checkbox' class='selcheck' data-name='" + data[i].nname + "' data-id='" + i + "' /></td><td>" + data[i].oname + "</td><td><span class='selcompare' data-id='" + i + "' />No</td>" +
                        "<td style='text-align:center'><input type='checkbox' class='selcheck' data-name='" + data[i].nname + "' data-id='" + i + "' /></td><td>" + data[i].nname + "</td><td><span class='selcompare' data-id='" + i + "' />No</td>";

                    $("#tblCompareScreens").append("<tr class='nr'>" + tdata + "</tr>");
                }
            }

            // DELETED SCREENS ONLY
            var NotFound = true;
            for (var i = 0; i < data.length; i++) {
                if (data[i].oname != '' && data[i].nname == '') {
                    tdata = "<td>" + data[i].oname + "</td>";
                    NotFound = false;
                    $("#tblDelScreens").append("<tr class='nr'>" + tdata + "</tr>");
                }
            }

            if (NotFound) {
                $("#tblDelScreens").append("<tr class='nr'><td>No Deleted Screens</td></tr>");
            }

            // ADDED SCREENS ONLY
            NotFound = true;
            for (var i = 0; i < data.length; i++) {
                if (data[i].nname != '' && data[i].oname == '') {
                    tdata = "<td>" + data[i].nname + "</td>";
                    NotFound = false;
                    $("#tblAddScreens").append("<tr class='nr'>" + tdata + "</tr>");
                }
            }

            if (NotFound) {
                $("#tblAddScreens").append("<tr class='nr'><td>No Added Screens</td></tr>");
            }
        }
    </script>

</body>

</html>
`;
