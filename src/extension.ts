import * as vscode from 'vscode';
import * as _file from './CreateFile';
import * as _test from './CreateTest';
import updateNamespace from './NamespaceUpdate';
import CodeAction from './Providers/CodeAction';
import CodeLens from './Providers/CodeLens';
import * as _refactor from './Refactor';

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
        // extract
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.extract_to_function`, async () => await _refactor.extractToFunction()),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.extract_to_property`, async () => await _refactor.extractToProperty()),
        // add missing
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.add_missing_function`, async () => await _refactor.addMissingFunction()),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.add_missing_prop`, async () => await _refactor.addMissingProperty()),
        // providers
        vscode.languages.registerCodeLensProvider(['php'], new CodeLens()),
        vscode.languages.registerCodeActionsProvider(['php'], new CodeAction()),
        // events
        vscode.workspace.onDidRenameFiles(async (event: vscode.FileRenameEvent) => await updateNamespace(event)),
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
