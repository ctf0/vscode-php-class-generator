import * as vscode from 'vscode';
import * as Parser from './Symbol/Parser';
import * as helpers from './Symbol/SymbolsAndReferences';
import * as utils from './utils';

export async function extractToFunction() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const { selections, document } = editor;

        if (selections.length > 1) {
            return utils.showMessage('extract to function doesnt work with multiple selections');
        }

        const selection = selections[0];
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (_methodsOrFunctions.length) {
                if (utils.hasStartOrEndIntersection(selections, _methodsOrFunctions)) {
                    return utils.showMessage('selection cant be at the same line of f/m start or end line');
                }

                let methodName = await vscode.window.showInputBox({
                    placeHolder: 'function name',
                });

                if (!methodName) {
                    return utils.showMessage('please enter a method/function name');
                }

                methodName = methodName.replace(/^\$/, '');

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
                if (utils.hasStartOrEndIntersection(selections, _methodsOrFunctions)) {
                    return utils.showMessage('selection cant be at the same line of f/m start or end line');
                }

                let propertyName: any = await vscode.window.showInputBox({
                    placeHolder: 'property name',
                });

                if (!propertyName) {
                    return utils.showMessage('please enter a property name');
                }

                propertyName = propertyName.replace(/^\$/, '');

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

export async function addMissingFunction() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const { selections, document } = editor;

        if (selections.length > 1) {
            return utils.showMessage('add missing function doesnt work with multiple selections');
        }

        const selection = selections[0];
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (_methodsOrFunctions.length) {
                const wordRange = document.getWordRangeAtPosition(selection.active, /\w+\(.*?\)/);

                if (wordRange) {
                    const methodAndParams = document.getText(wordRange);
                    const methodName = methodAndParams.replace(/\(.*/, '');

                    if (!_methodsOrFunctions.some((item) => item.name == methodName)) {
                        const cursorIntersection = _methodsOrFunctions.find((item: vscode.DocumentSymbol) => item.range.intersection(selection));
                        const isFunction = cursorIntersection?.kind == vscode.SymbolKind.Function;

                        if (cursorIntersection) {
                            let activeLine = document.lineAt(cursorIntersection.range.start.line);
                            const indentation = activeLine.text.substring(0, activeLine.firstNonWhitespaceCharacterIndex);
                            let contentIndentation = '';

                            if (!indentation) {
                                activeLine = document.lineAt(selection.start.line);
                                contentIndentation = activeLine.text.substring(0, activeLine.firstNonWhitespaceCharacterIndex);
                            }

                            const methodType = isFunction ? '' : 'private ';
                            const methodContent = '\n\n' +
                                `${indentation}${methodType}function ${methodAndParams}\n` +
                                `${indentation}{\n` +
                                `${indentation}}`;

                            await editor.edit((edit: vscode.TextEditorEdit) => {
                                edit.insert(cursorIntersection.range.end, methodContent);
                            }, { undoStopBefore: false, undoStopAfter: false });
                        }
                    }
                }
            }
        }
    }
}
