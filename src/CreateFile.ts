import fs from 'fs-extra';
import { pascalCase } from 'pascal-case';
import * as vscode from 'vscode';
import * as utils from './utils';

async function generateCode(filePath, prefix) {
    const cn = pascalCase(utils.getFileNameFromPath(filePath));
    let declaration = `${prefix} ${cn}`;
    const namespace = await utils.getFileNamespace(vscode.Uri.file(filePath)) || '\n';

    if (prefix == 'class') {
        declaration = `\${1|abstract ,final |}class ${cn}\${2: \${3|extends ,implements |}\$4}`;
    }

    if (prefix == 'interface') {
        declaration = `${prefix} ${cn}\${2: extends }`;
    }

    return '<?php\n' +
        namespace +
        `${declaration}\n` +
        '{\n' +
        '  $0' +
        '\n}';
}

export async function insertSnippet(type) {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const path = editor.document.fileName;

        return editor.insertSnippet(
            new vscode.SnippetString(await generateCode(path, type)),
            new vscode.Position(0, 0),
        );
    }
}

export async function createFile(path, type, fileName: any = null) {
    type = pascalCase(type);
    let name: any = fileName;

    if (!name) {
        name = await vscode.window.showInputBox({
            placeHolder : `Name ex.MyNew${type}`,
            prompt      : `Name of ${type}`,
        });

        if (!name) {
            return utils.showMessage(`please add the name of the ${type}`);
        }
    }

    name = pascalCase(name.replace('.php', ''));
    name = `${path}/${name}.php`;

    if (await fs.pathExists(name)) {
        utils.showMessage('path already exists', false, ['Open File']).then((e) => {
            if (e) {
                return utils.openFile(name);
            }
        });

        throw 'already exists';
    }

    await fs.outputFile(name, '');

    return utils.openFile(name);
}
