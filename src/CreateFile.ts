import fs from 'node:fs';
import { pascalCase } from "pascal-case";
import * as vscode from 'vscode';
import * as utils from './utils';

async function generateCode(filePath, prefix) {
    let cn = pascalCase(utils.getFileNameFromPath(filePath))
    let ns = await utils.getFileNamespace()
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

export async function insertSnippet(type) {
    let editor = vscode.window.activeTextEditor

    if (editor) {
        let path = editor.document.fileName

        return editor.insertSnippet(
            new vscode.SnippetString(await generateCode(path, type)),
            new vscode.Position(0, 0)
        )
    }
}

export async function createFile(path, type, fileName: any = null) {
    type = pascalCase(type)
    let name: any = fileName

    if (!name) {
        name = await vscode.window.showInputBox({
            placeHolder: `Name ex.MyNew${type}`,
            prompt: `Name of ${type}`
        })

        if (!name) {
            return utils.showMessage(`please add the name of the ${type}`)
        }
    }

    name = pascalCase(name.replace('.php', ''))
    name = `${path}/${name}.php`

    if (fs.existsSync(name)) {
        return utils.openFile(name)
    }

    fs.mkdirSync(utils.getDirNameFromPath(name), { recursive: true })
    fs.writeFileSync(name, '')

    return utils.openFile(name)
}
