const vscode = require('vscode');

let utils = require('./utils');

let nsVendor = ''
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
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_class`, function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "class", nsVendor, classType)
                );
            })
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_interface`, function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "interface", nsVendor)
                );
            })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(`${PACKAGE_NAME}.generate_trait`, function () {
            let editor = vscode.window.activeTextEditor;
            let path = editor.document.fileName;

            editor.edit(eb => {
                eb.replace(
                    new vscode.Position(editor.selection.active.line, 0),
                    utils.generateCode(path, "trait", nsVendor)
                );
            })
        })
    )
}
exports.activate = activate;

function readConfig() {
    let config = vscode.workspace.getConfiguration(PACKAGE_NAME);

    nsVendor = config.get('vendor');
    classType = config.get('classType');
}

function deactivate() { }
exports.deactivate = deactivate;
