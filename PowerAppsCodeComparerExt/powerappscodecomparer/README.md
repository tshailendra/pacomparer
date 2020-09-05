# PowerApps Code Comparer

PowerApps Code comparer helps you to compare two PowerApps (*.msapp) files for the changes done.  Save two versions of a Canvas app to your local machine and provide as an input to compare.

<br>

![run](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/run.gif?raw=true)

<br>

## Install

Launch VS Code Quick Open (Ctrl + P), paste the following command and press enter:

```sh
$ ext install vs-code powerappscodecomparer
```

Or press Ctrl + Shift + X and search for __"PowerApps Code Comparer"__


## How to use

- Download the PowerApps files to compare  
- Launch Command Palette _(Ctrl+Shift+A or P)_
- Type __PowerApps Code Comparer__
- Select/Click __PowerApps Code Comparer__
- Select *.msapp files downloaded


- File selection - **Custom Run**

    <ol>
    <li>Click <i>Custom Run</i> - In this mode you have an option to select specific screen(s) to compare.  Overall execution time would be faster as compared to <b>Auto Run</b> (considering only few screens are selected and not all screens from the selected file)

    ![start screen](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/start.PNG?raw=true)
    </li>
    <li>Click <i>Choose File</i> under <b>Old and New Versions</b> respectively, and select file</li>
    <li>Click <i>Show Screen</i> to display screens from respective selected files</li>
    <li>Select screen(s) for comparison 
        
    ![Custom Run](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/customrun.PNG?raw=true)
    </li>
    <li>Click <i>Compare Files</i> to view the differences
    
    ![Treeview](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/treeview.png?raw=true)
    
    </li>
    <li>Double click on any row to view the details of the selected row
    
    ![popup](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/popup.png?raw=true)
    
    </li>
    <li><i>Screen available in Old version and not in New version are displayed in <b>Deleted Screens</b></i></li>
    <li><i>Screen available in New version and not in Old version are displayed in <b>Added Screens</b></i></li>
    </ol>

- File selection - **Auto Run**
    <ol>
    <li>Click <i>Custom Run</i> - In this mode you need to select  two PowerApps files for comparison.  Overall execution time might be longer as compared to <b>Custom Run</b>, as all the common screens in the selected files are compared

    ![AutoRun](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/autorun.png?raw=true)
    </li>
    <li><i>Screen(s) which are not in either of the selected files will be ignored for comparison</i></li>
    </ol>


- Navigation

    <ul>
    <li>
    Click the navigation icon (up/down arrows) to scroll to the nearest change

    ![Navigation](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/navigation.png?raw=true)
    </li>
    <li>
    If the nodes are collapsed, on click of any navigation icon, the nodes are automatically expanded
    </li>
    </ul>

## Known Issues

The code is not tested for components developed using pcf.
