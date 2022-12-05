import * as vscode from 'vscode'
import path from 'node:path'
import {titleCase} from 'title-case'
import {findUp, pathExists} from 'find-up'
const fs   = require('fs')

export const PACKAGE_CMND_NAME = 'phpclassgen'
export const PACKAGE_NAME = 'phpClassGenerator'
export let config: any
let NS_EXTENSION_PROVIDER

function getClassNameFromPath(filePath) {
    return path.parse(filePath).name
}

async function generateCode(filePath, prefix) {
    let cn          = titleCase(getClassNameFromPath(filePath))
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

export async function insertSnippet(type)
{
    let editor = vscode.window.activeTextEditor
    let path   = editor.document.fileName

    return editor.insertSnippet(
        new vscode.SnippetString(await generateCode(path, type)),
        new vscode.Position(0, 0)
    )
}

export async function createFile(path, type, fileName: any = null) {
    type = titleCase(type)

    let name: any = fileName

    if (!name) {
        name = await vscode.window.showInputBox({
            placeHolder : `Name ex.MyNew${type}`,
            prompt      : `Name of ${type}`
        })

        if (!name) {
            return showMessage(`please add the name of the ${type}`)
        }
    }

    name = titleCase(name.replace('.php', ''))

    name = `${path}/${name}.php`

    if (fs.existsSync(name)) {
        await openFile(name)

        return showMessage(`${name} already exists`, true)
    }

    writeFileSyncRecursive(name)

    return openFile(name)
}

export async function createTest(e) {
    let testFolderName = config.testFolderName

    let selectedTestTypes = await vscode.window.showQuickPick(
        config.testTypes,
        {
            placeHolder : 'choose what types of tests you want to create',
            canPickMany : true
        }
    )

    if (selectedTestTypes && selectedTestTypes.length) {
        let docPath = e ? e.fsPath : vscode.window.activeTextEditor?.document?.fileName

        if (docPath) {
            let docName = getClassNameFromPath(docPath)
            let docDir  = path.parse(docPath).dir

            let foundDir = await findUp(
                async (directory) => await pathExists(path.join(directory, testFolderName)) && directory,
                {
                    cwd  : docDir,
                    type : 'directory'
                }
            )

            if (foundDir) {
                let type     = 'class'
                let testName = `${docName}Test`

                await Promise.all(
                    selectedTestTypes.map(async (testType) => {
                        let testPath = `${foundDir}/${testFolderName}/${testType}` + docDir.replace(foundDir, '')

                        await createFile(testPath, type, testName)
                        await insertSnippet(type)
                    })
                )
            } else {
                showMessage(`please create a ${testFolderName} folder first`, true)
            }
        }
    } else {
        showMessage('please select a type to create')
    }
}

function writeFileSyncRecursive(filename, content = '') {
    fs.mkdirSync(path.dirname(filename), {recursive: true})
    fs.writeFileSync(filename, content)
}

export function showMessage(msg, error = false)
{
    return error
        ? vscode.window.showErrorMessage(`PHP Class Generator: ${msg}`)
        : vscode.window.showInformationMessage(`PHP Class Generator: ${msg}`)
}

export async function openFile(filePath)
{
    return vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(filePath)))
}

export async function NsExtensionProviderInit() {
    const nsResolverExtension = vscode.extensions.getExtension('ctf0.php-namespace-resolver')

    if (nsResolverExtension == null) {
        throw new Error('Depends on \'ctf0.php-namespace-resolver\' extension')
    }

    NS_EXTENSION_PROVIDER = await nsResolverExtension.activate()
}

export function setConfig() {
    config = vscode.workspace.getConfiguration(PACKAGE_NAME);
}
