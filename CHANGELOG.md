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
