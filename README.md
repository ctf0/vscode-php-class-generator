# Php Class Generator

based on https://marketplace.visualstudio.com/items?itemName=damianbal.vs-phpclassgen

- remove generate namespace command
- remove vendor config
- add make test command

## Test File Creation

```
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
