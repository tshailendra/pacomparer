# PowerApps Code Comparer

PowerApps Code comparer helps you to compare two PowerApps (*.msapp) files for the changes done in the files.  Save any two versions of a Canvas app to your local machine and provide as an input to compare.

## Install

Launch VS Code Quick Open (Ctrl + P), paste the following command and press enter:

```sh
$ ext install vs-code powerappscodecomparer
```

Or press Ctrl + Shift + X and search for __"PowerApps Code Comparer"__


## How to use

- Download the PowerApps files required to compare  
- Launch Command Palette _(Ctrl+Shift+A or P)_
- Type __PowerApps Code Comparer__
- Select/Click __PowerApps Code Comparer__
- Select *.msapp files downloaded



![run](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/run.gif?raw=true)


- Double click on any row to view the details of the selected row.

![popup](https://github.com/tshailendra/pacomparer/blob/master/PowerAppsCodeComparerExt/powerappscodecomparer/images/popup.png?raw=true)



## Known Issues

The code is not tested for components developed using pcf.

## Release Notes

### 0.0.6

Added background color to the selected row before opening popup window.

### 0.0.5

Initial release.

