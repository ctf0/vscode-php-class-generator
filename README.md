# Php Class Generator

based on https://marketplace.visualstudio.com/items?itemName=damianbal.vs-phpclassgen

- remove generate namespace command
- remove vendor config
- add make test command
- support updating file/s namespace on `move/rename`
    - glob exclude is populated from both `files.watcherExclude` & `search.exclude`
    - make sure to run `composer dump-autoload` b4 deploying to update its files

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

1. the test name will be the current file `className + Test` ex.`EmployeeTaxTest`
2. tests are created in the **nearest tests** directory to the original file ex.`Modules/Calculation/Tests/...`,
  or if not the cmnd will keep traversing up until it finds a directory of `tests` ex.`root/tests`
3. the test file will be created with the original class hierarchy ex.`.../Tests/{TestType}/Services/Taxes/EmployeeTaxTest.php`
4. if file already exists it will be opened instead
5. for the `Go To Test` codelens to show up, the class test file must be `className + Test` ex.`EmployeeTaxTest`
    - the search for the file is project wide, regardless of the folder hierarchy
