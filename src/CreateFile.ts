import fs from 'fs-extra';
import { pascalCase } from "pascal-case";
import * as vscode from 'vscode';
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
        const symbols: vscode.DocumentSymbol[] = await helpers.getFileSymbols(editor.document.uri);

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

                const currentLocation = _methodsOrFunctions.find((item: vscode.DocumentSymbol) => item.range.intersection(selection));
                const isFunction = currentLocation?.kind == vscode.SymbolKind.Function;

                if (currentLocation) {
                    const currentTxt = document.getText(selection);
                    let activeLine = document.lineAt(currentLocation.range.start.line);
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
                        edit.insert(currentLocation.range.end, methodContent);
                    });

                    await editor.edit((edit: vscode.TextEditorEdit) => {
                        const _this = isFunction ? '' : '$this->';

                        edit.replace(selection, `${_this}${methodName}();`);
                    });
                }
            } else {
                return utils.showMessage('only contents of method/function can be extracted');
            }
        }
    }
}
