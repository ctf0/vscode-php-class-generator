const vscode = require('vscode')
const utils  = require('./utils')

async function activate(context) {
    await utils.NsExtensionProviderInit()

    context.subscriptions.push(
        vscode.commands.registerCommand(`${utils.PACKAGE_NAME}.generate_class`, async (folder) => await createFile(folder, 'class')),
        vscode.commands.registerCommand(`${utils.PACKAGE_NAME}.generate_interface`, async (folder) => await createFile(folder, 'interface')),
        vscode.commands.registerCommand(`${utils.PACKAGE_NAME}.generate_trait`, async (folder) => await createFile(folder, 'trait')),
        vscode.commands.registerCommand(`${utils.PACKAGE_NAME}.generate_enum`, async (folder) => await createFile(folder, 'enum'))
    )
}
exports.activate = activate

async function createFile(folder, type)
{
    if (folder?.path) {
        await utils.createFile(folder.path, type)
    }

    await utils.insertSnippet(type)
}

function deactivate() { }
exports.deactivate = deactivate
