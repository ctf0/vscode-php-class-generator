import fs from 'fs-extra';
import { pascalCase } from "pascal-case";
import * as vscode from 'vscode';
import * as Parser from './Symbol/Parser';
import * as helpers from './Symbol/SymbolsAndReferences';
import * as utils from './utils';

async function generateCode(filePath, prefix) {
    const cn = pascalCase(utils.getFileNameFromPath(filePath));
    let declaration = `${prefix} ${cn}`;
    const namespace = await utils.getFileNamespace() || '';

    if (prefix == 'class') {
        declaration = `\${1|abstract ,final |}class ${cn}\${2: \${3|extends ,implements |}\$4}`;
    }

    if (prefix == 'interface') {
        declaration = `${prefix} ${cn}\${2: extends }`;
    }

    return '<?php\n' +
        `${namespace}\n` +
        `${declaration}\n` +
        '{\n' +
        '  $0' +
        '\n}';
}

export async function insertSnippet(type) {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const path = editor.document.fileName;

        return editor.insertSnippet(
            new vscode.SnippetString(await generateCode(path, type)),
            new vscode.Position(0, 0),
        );
    }
}

export async function createFile(path, type, fileName: any = null) {
    type = pascalCase(type);
    let name: any = fileName;

    if (!name) {
        name = await vscode.window.showInputBox({
            placeHolder : `Name ex.MyNew${type}`,
            prompt      : `Name of ${type}`,
        });

        if (!name) {
            return utils.showMessage(`please add the name of the ${type}`);
        }
    }

    name = pascalCase(name.replace('.php', ''));
    name = `${path}/${name}.php`;

    if (await fs.pathExists(name)) {
        utils.showMessage('path already exists', false, ['Open File']).then((e) => {
            if (e) {
                return utils.openFile(name);
            }
        });

        throw 'already exists';
    }

    await fs.outputFile(name, '');

    return utils.openFile(name);
}

export async function extractToFunction() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(editor.document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (_methodsOrFunctions.length) {
                const { selection, document } = editor;
                const methodName = await vscode.window.showInputBox({
                    placeHolder: 'function name',
                });

                if (!methodName) {
                    return utils.showMessage('please enter a method/function name');
                }

                if (_methodsOrFunctions.some((item) => item.name == methodName)) {
                    return utils.showMessage('method already exists', true);
                }

                const cursorIntersection = _methodsOrFunctions.find((item: vscode.DocumentSymbol) => item.range.intersection(selection));
                const isFunction = cursorIntersection?.kind == vscode.SymbolKind.Function;

                if (cursorIntersection) {
                    const currentTxt = document.getText(selection);
                    let activeLine = document.lineAt(cursorIntersection.range.start.line);
                    const indentation = activeLine.text.substring(0, activeLine.firstNonWhitespaceCharacterIndex);
                    let contentIndentation = '';

                    if (!indentation) {
                        activeLine = document.lineAt(selection.start.line);
                        contentIndentation = activeLine.text.substring(0, activeLine.firstNonWhitespaceCharacterIndex);
                    }

                    let docs = '';

                    if (utils.config.extractFunctionDoc) {
                        docs = `${indentation}/**\n` +
                            `${indentation} * @return mixed\n` +
                            `${indentation} */\n`;
                    }

                    const methodType = isFunction ? '' : 'private ';
                    const methodContent = '\n\n' +
                        docs +
                        `${indentation}${methodType}function ${methodName}()\n` +
                        `${indentation}{\n` +
                        `${indentation}${indentation || contentIndentation}${currentTxt}\n` +
                        `${indentation}}`;

                    await editor.edit((edit: vscode.TextEditorEdit) => {
                        edit.insert(cursorIntersection.range.end, methodContent);
                    }, { undoStopBefore: false, undoStopAfter: false });

                    await editor.edit((edit: vscode.TextEditorEdit) => {
                        const _this = isFunction ? '' : '$this->';

                        edit.replace(selection, `${_this}${methodName}();`);
                    }, { undoStopBefore: false, undoStopAfter: false });
                }
            } else {
                return utils.showMessage('only contents of method/function can be extracted');
            }
        }
    }
}

export async function extractToProperty() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const { selections, document } = editor;
        const methods = Parser.getAllMethodsOrFunctions(document.getText());
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(editor.document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (_methodsOrFunctions.length) {
                let propertyName: any = await vscode.window.showInputBox({
                    placeHolder: 'property name',
                });

                if (!propertyName) {
                    return utils.showMessage('please enter a property name');
                }

                const firstSelection = selections[0];
                const cursorIntersection: any = _methodsOrFunctions.find((item: vscode.DocumentSymbol) => item.range.intersection(firstSelection));

                if (cursorIntersection) {
                    const selectionTxt = document.getText(firstSelection);
                    const isEndOfStatement = selectionTxt.endsWith(';');

                    propertyName = `\$${propertyName}`;
                    const currentTxt = `${propertyName} = ${selectionTxt}${isEndOfStatement ? '' : ';'}`;

                    // replace selections
                    for (const selection of selections) {
                        await editor.edit((edit: vscode.TextEditorEdit) => {
                            edit.replace(selection, `${propertyName}${isEndOfStatement ? ';' : ''}`);
                        }, { undoStopBefore: false, undoStopAfter: false });
                    }

                    // add property
                    const currentMethod = methods.find((method) => cursorIntersection.name == method.name.name);
                    const _currentMethodStart = currentMethod.body.children[0].loc.start;
                    const _insertLocation = Parser.getRangeFromLoc(_currentMethodStart, _currentMethodStart);

                    const methodBodyLine = document.lineAt(_currentMethodStart.line - 1);
                    const indentation = methodBodyLine.text.substring(0, methodBodyLine.firstNonWhitespaceCharacterIndex);
                    const propertyContent = `${currentTxt}\n\n${indentation}`;

                    await editor.edit((edit: vscode.TextEditorEdit) => {
                        edit.insert(_insertLocation.end, propertyContent);
                    }, { undoStopBefore: false, undoStopAfter: false });
                }
            } else {
                return utils.showMessage('only contents of method/function can be extracted');
            }
        }
    }
}
