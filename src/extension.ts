import * as vscode from 'vscode';
import * as _file from './CreateFile';
import * as _test from './CreateTest';
import LensProvider from './Lens/LensProvider';
import updateNamespace from './NamespaceUpdate';
import * as utils from './utils';

export async function activate(context) {
    /* Other -------------------------------------------------------------------- */
    await utils.NsExtensionProviderInit();

    /* Config ------------------------------------------------------------------- */
    utils.setConfig();

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(utils.PACKAGE_NAME)) {
            utils.setConfig();
        }
    }, null, context.subscriptions);

    /* Commands ----------------------------------------------------------------- */
    context.subscriptions.push(
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_class`, async (folder) => await createFile(folder, 'class')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_interface`, async (folder) => await createFile(folder, 'interface')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_trait`, async (folder) => await createFile(folder, 'trait')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_enum`, async (folder) => await createFile(folder, 'enum')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_test_for_file`, async (e) => await _test.createTest(e)),

        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.open_test_file`, async (path) => await utils.openFile(path)),
    );

    if (utils.config.showCodeLens) {
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(['php'], new LensProvider()),
        );
    }

    vscode.workspace.onDidRenameFiles(async (event: vscode.FileRenameEvent) => await updateNamespace(event));
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
