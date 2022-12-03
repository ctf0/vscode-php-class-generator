const vscode      = require('vscode')
const path        = require('path')
const fs          = require('fs')
const toTitleCase = require('titlecase')

const PACKAGE_NAME = 'phpclassgen'
let NS_EXTENSION_PROVIDER

function getClassNameFromPath(filePath) {
    return path.basename(filePath).replace('.php', '')
}

async function generateCode(filePath, prefix) {
    let cn          = toTitleCase(getClassNameFromPath(filePath))
    let ns          = await NS_EXTENSION_PROVIDER.getNamespace()
    let declaration = `${prefix} ${cn}`

    if (prefix == 'class') {
        declaration = `\${1|abstract ,final |}class ${cn}\${2: \${3|extends ,implements |}\$4}`
    }

    if (prefix == 'interface') {
        declaration = `${prefix} ${cn}\${2: extends }`
    }

    return '<?php\n' +
        ns +
        '\n' +
        `${declaration}\n` +
        '{\n' +
        '  $0' +
        '\n}'
}

async function insertSnippet(type)
{
    let editor = vscode.window.activeTextEditor
    let path   = editor.document.fileName

    return editor.insertSnippet(
        new vscode.SnippetString(await generateCode(path, type)),
        new vscode.Position(0, 0)
    )
}

async function createFile(path, type) {
    type = toTitleCase(type)

    let name = await vscode.window.showInputBox({
        placeHolder : `Name ex.MyNew${type}`,
        prompt      : `Name of ${type}`
    })

    if (!name) {
        return showMessage(`please add the name of the ${type}`)
    }

    name = toTitleCase(name.replace('.php', ''))

    let fileName = `${path}/${name}.php`

    if (fs.existsSync(fileName)) {
        await openFile(fileName)

        return showMessage(`${name} already exists`, true)
    }

    writeFileSyncRecursive(fileName)

    return openFile(fileName)
}

function writeFileSyncRecursive(filename, content = '') {
    fs.mkdirSync(path.dirname(filename), {recursive: true})
    fs.writeFileSync(filename, content)
}

function showMessage(msg, error = false)
{
    return error
        ? vscode.window.showErrorMessage(`PHP Class Generator: ${msg}`)
        : vscode.window.showInformationMessage(`PHP Class Generator: ${msg}`)
}

async function openFile(fileName)
{
    return vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(fileName)))
}

async function NsExtensionProviderInit() {
    const nsResolverExtension = vscode.extensions.getExtension('ctf0.php-namespace-resolver')

    if (nsResolverExtension == null) {
        throw new Error('Depends on \'ctf0.php-namespace-resolver\' extension')
    }

    NS_EXTENSION_PROVIDER = await nsResolverExtension.activate()
}

module.exports = {
    PACKAGE_NAME,
    insertSnippet,
    createFile,
    NsExtensionProviderInit
}
