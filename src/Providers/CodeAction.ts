import * as vscode from 'vscode';
import * as helpers from '../Symbol/SymbolsAndReferences';
import * as utils from '../utils';

export default class CodeAction implements vscode.CodeActionProvider {
    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.CodeAction[] | undefined> {
        if (range.isEmpty) {
            return;
        }

        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(document.uri);

        if (symbols) {
            const _methodsOrFunctions = await helpers.extractNeededSymbols(symbols);

            if (!_methodsOrFunctions?.length) {
                return;
            }
        } else {
            return;
        }

        const commands = [
            {
                command : `${utils.PACKAGE_CMND_NAME}.extract_to_function`,
                title   : "Extract To Method/Function",
            },
        ];

        if (!vscode.window.activeTextEditor?.selections.some((item) => document.getText(item).trim().startsWith('return'))) {
            commands.push(
                {
                    command : `${utils.PACKAGE_CMND_NAME}.extract_to_property`,
                    title   : "Extract To Property",
                },
            );
        }

        return commands.map((item) => this.createCommand(item));
    }

    private createCommand(cmnd: { command: any; title: any; }): vscode.CodeAction {
        const action = new vscode.CodeAction(cmnd.title, vscode.CodeActionKind.RefactorExtract);
        action.command = { command: cmnd.command, title: cmnd.title };

        return action;
    }
}
