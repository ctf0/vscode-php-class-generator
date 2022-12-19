# Php Class Generator

based on https://marketplace.visualstudio.com/items?itemName=damianbal.vs-phpclassgen

- remove generate namespace command
- remove vendor config
- add (basic) extract selection to method "selection must be inside a method/function"
    - make sure editor can read file symbols ex.[intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client), [phptools](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.phptools-vscode), etc..
- add make test command
- support updating file/s namespace on `move/rename`
    - glob exclude is populated from both `files.watcherExclude` & `search.exclude`

<br>

## File Namespace Updates

atm vscode cant auto save the references changes we make on class rename [issue #168825](https://github.com/microsoft/vscode/issues/168825) so as a way around, we will update the namespace to an alias ex.`use App\Some\Path as ClassName` to avoid changing incorrect references & make sure your code still works.

when the open ticket is resolved, the extension will update the references correctly without any work-arounds.

still if you dont want this behavior, you can set `phpClassGenerator.setNamespaceToAlias: false`

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
