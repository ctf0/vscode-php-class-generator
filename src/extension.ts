import * as vscode from 'vscode';
import * as _file from './CreateFile';
import * as _test from './CreateTest';
import CodeAction from './Providers/CodeAction';
import CodeLens from './Providers/CodeLens';

import * as utils from './utils';

export async function activate(context) {
    /* Other -------------------------------------------------------------------- */
    await utils.NsExtensionProviderInit();

    /* Config ------------------------------------------------------------------- */
    utils.setConfig();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(utils.PACKAGE_NAME)) {
                utils.setConfig();
            }
        }),
    );

    /* Commands ----------------------------------------------------------------- */
    context.subscriptions.push(
        // generate
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_class`, async (folder) => await createFile(folder, 'class')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_interface`, async (folder) => await createFile(folder, 'interface')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_trait`, async (folder) => await createFile(folder, 'trait')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_enum`, async (folder) => await createFile(folder, 'enum')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_test_for_file`, async (e) => await _test.createTest(e)),
        // open
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.open_test_file`, async (path) => await utils.openFile(path)),
        // providers
        vscode.languages.registerCodeLensProvider(['php'], new CodeLens()),
        vscode.languages.registerCodeActionsProvider(['php'], new CodeAction()),
    );
}

async function createFile(folder, type) {
    if (folder?.path) {
        try {
            await _file.createFile(folder.path, type);
        } catch (error) {
            return;
        }
    }

    await _file.insertSnippet(type);
}

export function deactivate() { }
