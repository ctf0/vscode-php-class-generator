const vscode = require('vscode');

let utils = require('./src/utils');

const PACKAGE_NAME = 'phpclassgen'

async function activate(context) {
    /* Config ------------------------------------------------------------------- */
    readConfig()

    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(PACKAGE_NAME)) {
            readConfig()
        }
    })

    /* Commands ----------------------------------------------------------------- */
    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_class`, async function (folder) {
            if (folder?.path) {
                await utils.createFile(folder.path, 'class')
            }

            await utils.insertSnippet('class')
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_interface`, async function (folder) {
            if (folder?.path) {
                await utils.createFile(folder.path, 'interface')
            }

            await utils.insertSnippet('interface')
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_trait`, async function (folder) {
            if (folder?.path) {
                await utils.createFile(folder.path, 'trait')
            }

            await utils.insertSnippet('trait')
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_enum`, async function (folder) {
            if (folder.path) {
                await utils.createFile(folder.path, 'enum')
            }

            await utils.insertSnippet('enum')
        })
    )
}
exports.activate = activate;

function readConfig() {
    let config = vscode.workspace.getConfiguration(PACKAGE_NAME);
}

function deactivate() { }
exports.deactivate = deactivate;
