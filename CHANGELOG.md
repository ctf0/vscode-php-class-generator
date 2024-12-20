# Change Log

## 0.0.1

- Initial release

## 0.0.2

- fix namespace resolving

## 0.0.3

- remove ext dependencies
- remove config
- use snippets to give better usage flow
- add enums
- add explorer context menu option

## 0.0.5

- add interface option for class gen
- remove the indentations from the last snippet tab

## 0.0.6

- fix `enum` creation error
- update vscode

## 0.1.0

- make sure class name is titlecased
- add `ctf0.php-namespace-resolver` as dependency and use it

## 0.1.1

- make sure file name is titlecased
- make sure commands only show up in php files only
- correctly insert the namespace without canceling snippet operation
- prefix commands with pkg name

## 0.1.2

- add cmnd to create test
- make cmnds available in editor context menu
- u can also create a test for a file by right click in explorer and choose `Generate PHP Test`

## 0.1.3

- add codelens to go to current class test file

## 0.1.4

- add codelens to go to test abstraction

## 0.1.5

- support navigating to all types of the class tests in the codelens

## 0.2.0

- support auto updating file/s namespace on move

## 0.2.1

- disable 020 update until more test cases are done

## 0.2.3

- fix 020 issues
- fix insert snippet even if file already exists
- use async ops everywhere
- add away to open already existing file while having the ability to complete the snippet,
  sadly there is no way to know when the user has completed the snippet

## 0.2.5

- fix https://github.com/ctf0/vscode-php-class-generator/issues/2
- partially fix https://github.com/ctf0/vscode-php-class-generator/issues/3

## 0.2.7

- fix showing error on folder moving, now we check if the folder have at least 1 php file b4 handling it

## 0.2.8

- update readme

## 0.3.0

- fix not updating FQN class declaration
- add function/method extract
- add new option to disable updating namespace to alias on class rename `phpClassGenerator.setNamespaceToAlias: false`

## 0.3.2

- remove config `phpClassGenerator.setNamespaceToAlias`
- add new config `phpClassGenerator.openUnchangedFiles`
- update rdme

## 0.4.0

- use regex to change the class references instead
- remove ripgrip config and usage

## 0.4.1

- add extract to property

## 0.4.2

- dont show extract to action if selection is on the same start or end method/function line
- make sure extract to function doesnt work with multiple selections

## 0.4.3

- add new config `phpClassGenerator.enableCodeActions` to enable/disable code actions

## 0.4.8

- make sure code action/lens updates on config change
- make sure to cleanup double `$` of property name extraction
- group menu items to submenu to save space in the context menu

## 0.5.0

- add new config `phpClassGenerator.updateFileAndReferenceOnRename`

## 0.5.1

- add new command/code action `Add Missing Method/Function Declaration`

## 0.5.2

- add cmnd `generate file tests` to the code actions

## 0.5.3

- add new `Add Missing Property` to the code actions
- fix `Add Missing Method/Function Declaration` scope
- remove `Add Missing Method/Function Declaration` from context menu & command palette

## 0.5.5

- remove code refactor and move it to its own extension

## 0.5.7

- remove file move/rename refactor and move it to `ctf0.vscode-php-refactor` extension
- remove `phpClassGenerator.updateFileAndReferenceOnRename` & `phpClassGenerator.enableCodeActions` configs

## 0.6.0

- better lockup for the test files that actually relate to the opened file instead of a random one.
- show file path in the codelens when hovered to avoid jumping to the wrong file

## 0.6.1

- a missed note for 060: the test folder name is now case-sensitive, this is needed to make sure we find the correct nearest files instead of going everywhere.

## 0.6.2

- allow to open multiple files at once

## 0.6.3

- sometimes a test could be found but not under any of the test types, now we have support for that as well
