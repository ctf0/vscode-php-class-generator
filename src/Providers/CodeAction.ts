import * as vscode from 'vscode';
import * as helpers from '../Symbol/SymbolsAndReferences';
import * as utils from '../utils';

export default class CodeAction implements vscode.CodeActionProvider {
    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.CodeAction[] | undefined> {
        if (!document || !utils.config.enableCodeActions) {
            return;
        }

        const commands: any = [];

        // @ts-ignore
        const { selections } = vscode.window.activeTextEditor;
        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (!_methodsOrFunctions?.length) {
                return;
            }

            if (
                _methodsOrFunctions &&
                utils.hasStartOrEndIntersection(selections, _methodsOrFunctions)
            ) {
                return;
            }

            if (range.isEmpty) {
                const wordRange = document.getWordRangeAtPosition(selections[0].active, /\w+(?=\()/);

                if (wordRange) {
                    const methodName = document.getText(wordRange);

                    if (!_methodsOrFunctions.some((item) => item.name == methodName)) {
                        commands.push(
                            {
                                command : `${utils.PACKAGE_CMND_NAME}.add_missing_function`,
                                title   : 'Add Missing Method/Function Declaration',
                            },
                        );
                    }
                }
            }
        } else {
            return;
        }

        if (!range.isEmpty) {
            if (selections.length == 1) {
                commands.push({
                    command : `${utils.PACKAGE_CMND_NAME}.extract_to_function`,
                    title   : 'Extract To Method/Function',
                });
            }

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
