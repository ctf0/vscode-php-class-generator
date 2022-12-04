import * as vscode from 'vscode'
import * as utils  from './utils'

export async function activate(context) {
    /* Other -------------------------------------------------------------------- */
    await utils.NsExtensionProviderInit()

    /* Config ------------------------------------------------------------------- */
    utils.setConfig()

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(utils.PACKAGE_NAME)) {
            utils.setConfig()
        }
    }, null, context.subscriptions)

    /* Commands ----------------------------------------------------------------- */
    context.subscriptions.push(
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_class`, async (folder) => await createFile(folder, 'class')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_interface`, async (folder) => await createFile(folder, 'interface')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_trait`, async (folder) => await createFile(folder, 'trait')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_enum`, async (folder) => await createFile(folder, 'enum')),
        vscode.commands.registerCommand(`${utils.PACKAGE_CMND_NAME}.generate_test_for_file`, async (e) => await utils.createTest(e))
    )
}

async function createFile(folder, type)
{
    if (folder?.path) {
        await utils.createFile(folder.path, type)
    }

    await utils.insertSnippet(type)
}

export function deactivate() { }
