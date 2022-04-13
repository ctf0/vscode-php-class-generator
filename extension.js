const vscode = require('vscode');

let utils = require('./utils');

let classType = ''
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
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_class`, async function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            await editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "class", classType)
                );
            })

            resolveNamespace();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_interface`, async function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            await editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "interface")
                );
            })

            resolveNamespace();
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_trait`, async function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            await editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "trait")
                );
            })

            resolveNamespace();
        })
    )
}
exports.activate = activate;

function resolveNamespace() {
    vscode.commands.executeCommand('namespaceResolver.generateNamespace');
}

function readConfig() {
    let config = vscode.workspace.getConfiguration(PACKAGE_NAME);

    classType = config.get('classType');
}

function deactivate() { }
exports.deactivate = deactivate;
