import escapeStringRegexp from 'escape-string-regexp';
import fs from 'node:fs';
import replace from 'replace-in-file';
import * as vscode from 'vscode';
import * as utils from './utils';

export default async function updateNamespace(event) {
    let files = event.files

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        cancellable: false,
        title: 'Updating Please Wait'
    }, async (progress) => {
        progress.report({ increment: 0 });

        /* -------------------------------------------------------------------------- */
        for (const file of files) {
            const _old = file.oldUri.fsPath
            const _new = file.newUri.fsPath
            const _scheme = fs.statSync(_new)

            try {
                if (_scheme.isDirectory()) {
                    await replaceOldNamespaceForDirs(_new, _old)
                } else {
                    // moved to new dir
                    if (utils.getDirNameFromPath(_new) !== utils.getDirNameFromPath(_old)) {
                        await updateFileNamespace(_new)
                        await replaceOldNamespaceForFiles(_new, _old)
                    }
                    // new file name
                    else {
                        continue
                    }
                }
            } catch (error) {
                console.error(error)
                break
            }
        }
        /* -------------------------------------------------------------------------- */

        progress.report({ increment: 100 });
    });
}

async function replaceOldNamespaceForFiles(fileNewPath: string, fileOldPath: string) {
    let _new_ns = await getNamespaceFromPath(fileNewPath)
    _new_ns = getFQN(_new_ns) + '\\' + utils.getFileNameFromPath(fileNewPath)

    let _old_ns = await getNamespaceFromPath(fileOldPath)
    _old_ns = getFQN(_old_ns) + '\\' + utils.getFileNameFromPath(fileOldPath)

    return updateEverywhere(fileNewPath, _old_ns, _new_ns)
}

async function replaceOldNamespaceForDirs(dirNewPath: string, dirOldPath: string) {
    let _new_ns = await getNamespaceFromPath(dirNewPath + '/ph.php')
    _new_ns = getFQN(_new_ns)

    let _old_ns = await getNamespaceFromPath(dirOldPath + '/ph.php')
    _old_ns = getFQN(_old_ns)

    return updateEverywhere(dirNewPath, _old_ns, _new_ns)
}

async function updateFileNamespace(filePath) {
    const _new_ns = await getNamespaceFromPath(filePath)

    return replace.replaceInFile({
        files: filePath,
        from: new RegExp(/^namespace.*$/, 'gm'),
        to: _new_ns ? _new_ns.replace(/\n/g, '') : ''
    })
}

async function getNamespaceFromPath(filePath) {
    const uri = vscode.Uri.file(filePath)

    return utils.getFileNamespace(uri)
}

function getFQN(text) {
    return text.replace(/(namespace\s+|\n|;)/g, '')
}

async function updateEverywhere(fileOrDirNewPath, changeFrom, changeTo) {
    const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fileOrDirNewPath))?.uri.fsPath

    return replace.replaceInFile({
        files: `${cwd}/**/*!(blade).php`,
        ignore: utils.filesExcludeGlob,
        from: new RegExp(escapeStringRegexp(changeFrom), 'g'),
        to: changeTo
    })
}
