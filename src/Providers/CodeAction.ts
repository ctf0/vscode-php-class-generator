import * as vscode from 'vscode';
import * as helpers from '../Helpers/SymbolsAndReferences';
import * as utils from '../Helpers/utils';

export default class CodeAction implements vscode.CodeActionProvider {
    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.CodeAction[] | undefined> {
        if (!document) {
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

        return commands.map((item) => this.createCommand(item));
    }

    private createCommand(cmnd: { command: string; title: string; }): vscode.CodeAction {
        const action = new vscode.CodeAction(cmnd.title, vscode.CodeActionKind.RefactorExtract);
        action.command = { command: cmnd.command, title: cmnd.title };

        return action;
    }
}
