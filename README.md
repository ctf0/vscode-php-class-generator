# Php Class Generator

based on https://marketplace.visualstudio.com/items?itemName=damianbal.vs-phpclassgen

- remove generate namespace command
- remove vendor config
- add make test command
- support updating file/s namespace on `move/rename`
    - glob exclude is populated from both `files.watcherExclude` & `search.exclude`
    - make sure to run `composer dump-autoload` b4 deploying to update its files
- add (basic) extract selection to method/property "selection must be inside a method/function"
    - new method/function will be added right after the selection method/function
    - make sure you have ([intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client), [phptools](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.phptools-vscode), etc..) so we can collect document symbols to work with

<br>

## Test File Creation

```plain
/
└── Modules
    └── Calculation
        ├── Tests
        └── Services
            └── Taxes
                ├── WorkerTax.php
                └── EmployeeTax.php <- create test for this file
```

- the test name will be the current file `className + Test` ex.`EmployeeTaxTest`
- tests are created in the **nearest tests** directory to the original file ex.`Modules/Calculation/Tests/...`,
  or if not the cmnd will keep traversing up until it finds a directory of `tests` ex.`root/tests`
- the test file will be created with the original class hierarchy ex.`.../Tests/{TestType}/Services/Taxes/EmployeeTaxTest.php`
- if file already exists it will be opened instead
- for the `Go To Test` codelens to show up, the class test file must be `className + Test` ex.`EmployeeTaxTest`
