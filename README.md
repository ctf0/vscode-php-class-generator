# Php Class Generator

based on https://marketplace.visualstudio.com/items?itemName=damianbal.vs-phpclassgen

- remove generate namespace command
- remove vendor config
- add make test command

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

> PS 🔺

the navigation between the class to its test & vice-versa doesnt follow anything other than the name of the class to connect the dots,
which means if you have multiple classes with the same name in both ways `class & test` you might get directed to the wrong file,
so to use this feature the names have to be as unique as possible,

however, the codelens now have the support to
  - showing the file path on hover
  - for multi files you will get a QuickPick to choose from
