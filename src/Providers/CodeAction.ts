import * as vscode from 'vscode';
import * as helpers from '../Symbol/SymbolsAndReferences';
import * as utils from '../utils';

export default class CodeAction implements vscode.CodeActionProvider {
    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.CodeAction[] | undefined> {
        if (!document || !utils.config.enableCodeActions) {
            return;
        }

        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const commands: any = [];

        // @ts-ignore
        const { selections } = editor;
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(document.uri);

        if (symbols) {
            const _methodsOrFunctions: vscode.DocumentSymbol[] | undefined = await helpers.extractMethodSymbols(symbols);

            if (!_methodsOrFunctions) {
                return;
            }

            if (
                _methodsOrFunctions &&
                utils.hasStartOrEndIntersection(selections, _methodsOrFunctions)
            ) {
                return;
            }

            if (range.isEmpty) {
                const activeSelection = selections[0].active;

                // add_missing_function
                const methodWordRange = document.getWordRangeAtPosition(activeSelection, /(?<=(:|\$this->))\w+(?=\()/);

                if (methodWordRange) {
                    const methodName = document.getText(methodWordRange);

                    if (!_methodsOrFunctions.some((item) => item.name == methodName)) {
                        commands.push(
                            {
                                command : `${utils.PACKAGE_CMND_NAME}.add_missing_function`,
                                title   : 'Add Missing Method/Function Declaration',
                            },
                        );
                    }
                }

                // add_missing_prop
                const propWordRange = document.getWordRangeAtPosition(activeSelection, /(?<=(:\$|\$this->))\w+\b(?!\()/);

                if (propWordRange) {
                    const propName = document.getText(propWordRange);
                    const _props: vscode.DocumentSymbol[] | undefined = await helpers.extractPropSymbols(symbols);

                    if (!_props || !_props.some((item) => item.name == `\$${propName}`)) {
                        commands.push(
                            {
                                command : `${utils.PACKAGE_CMND_NAME}.add_missing_prop`,
                                title   : 'Add Missing Property',
                            },
                        );
                    }
                }

                // generate_test_for_file
                const classWordRange = document.getWordRangeAtPosition(activeSelection, /\w+/);

                if (classWordRange) {
                    const _classOrInterface: vscode.DocumentSymbol | undefined = await helpers.extractClassOrInterface(symbols, true);

                    if (_classOrInterface && _classOrInterface.name == document.getText(classWordRange)) {
                        commands.push({
                            command : `${utils.PACKAGE_CMND_NAME}.generate_test_for_file`,
                            title   : 'Generate Tests For File',
                        });
                    }
                }
            }
        } else {
            return;
        }

        if (!range.isEmpty) {
            // extract_to_function
            if (selections.length == 1) {
                commands.push({
                    command : `${utils.PACKAGE_CMND_NAME}.extract_to_function`,
                    title   : 'Extract To Method/Function',
                });
            }

            // extract_to_property
            if (!selections.some((item) => document.getText(item).trim().startsWith('return'))) {
                commands.push(
                    {
                        command : `${utils.PACKAGE_CMND_NAME}.extract_to_property`,
                        title   : 'Extract To Property',
                    },
                );
            }
        }

        return commands.map((item) => this.createCommand(item));
    }

    private createCommand(cmnd: { command: string; title: string; }): vscode.CodeAction {
        const action = new vscode.CodeAction(cmnd.title, vscode.CodeActionKind.RefactorExtract);
        action.command = { command: cmnd.command, title: cmnd.title };

        return action;
    }
}
