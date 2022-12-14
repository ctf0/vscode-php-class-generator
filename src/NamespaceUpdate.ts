import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs-extra';
import replace from 'replace-in-file';
import * as vscode from 'vscode';
import * as utils from './utils';

const TYPES = 'class|interface|enum|trait'
const TYPES_REG = new RegExp(TYPES)
const NAMESPACE_REG = /^namespace/m
const ERROR_MSG = 'nothing changed as we cant correctly update references'
const EXT = '.php'

export default async function updateNamespace(event: vscode.FileRenameEvent) {
    let files = event.files

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        cancellable: false,
        title: 'Updating Please Wait'
    }, async (progress) => {
        for (const file of files) {
            const from = file.oldUri.fsPath
            const to = file.newUri.fsPath
            const _scheme = await fs.stat(to)

            try {
                if (_scheme.isDirectory()) {
                    await replacefromNamespaceForDirs(to, from)
                } else {
                    // ignore if not php
                    if (utils.getFileExtFromPath(from) !== EXT || utils.getFileExtFromPath(to) !== EXT) {
                        continue
                    }

                    // moved to new dir
                    if (utils.getDirNameFromPath(to) !== utils.getDirNameFromPath(from)) {
                        let { _from, _to } = await getFileNameAndNamespace(to, from)

                        if (!_from.namespace || !_to.namespace) {
                            utils.showMessage(ERROR_MSG)
                            continue
                        }

                        if (await updateFileNamespace(to)) {
                            await updateEverywhereForFiles(to, _to, _from)
                        }
                    }
                    // new file name
                    else {
                        if (await updateFileContentByFileName(to, from)) {
                            await replaceFileNamespaceOnRename(to, from)
                        }
                    }

                }
            } catch (error) {
                // console.error(error)
                break
            }
        }
    });
}

/* Directory ---------------------------------------------------------------- */

async function replacefromNamespaceForDirs(dirToPath: string, dirFromPath: string) {
    let _from_ns = await getNamespaceFromPath(dirFromPath + `/ph${EXT}`)
    let _to_ns = await getNamespaceFromPath(dirToPath + `/ph${EXT}`)

    return updateEverywhereForDirs(
        dirToPath,
        getFQNOnly(_from_ns),
        getFQNOnly(_to_ns)
    )
}

/* Files Move --------------------------------------------------------------- */
async function updateFileNamespace(fileToPath) {
    let toNamespace = await getNamespaceFromPath(fileToPath)

    let results: any = await replace.replaceInFile({
        files: fileToPath,
        processor: (input) => {
            // if it has a namespace then its probably a class
            if (input.match(NAMESPACE_REG)) {
                input = input.replace(new RegExp(/(\n)?^namespace.*(\n)?/, 'm'), toNamespace)
            }

            return input
        }
    })

    return results[0].hasChanged
}

/* Files Rename ------------------------------------------------------------- */

async function updateFileContentByFileName(fileToPath: string, fileFromPath: string) {
    let { _from, _to } = await getFileNameAndNamespace(fileToPath, fileFromPath)

    let results: any = await replace.replaceInFile({
        files: fileToPath,
        processor: (input) => {
            // if it has a namespace then its probably a class
            if (input.match(TYPES_REG) && input.match(NAMESPACE_REG)) {
                // update only the class name & nothing else
                let match = input.match(`(${TYPES}) ${escapeStringRegexp(_from.name)}`)

                if (match) {
                    input = input.replace(match[0], `${match[1]} ${_to.name}`)
                }
            }

            return input
        }
    })

    return results[0].hasChanged
}

async function replaceFileNamespaceOnRename(fileToPath: string, fileFromPath: string) {
    let { _from, _to } = await getFileNameAndNamespace(fileToPath, fileFromPath)

    let fromNamespace = _from.namespace
    let toNamespace = _to.namespace

    if (!fromNamespace && !toNamespace) {
        return
    }

    return replace.replaceInFile({
        files: `${getCWD(fileToPath)}/**/*!(blade)${EXT}`,
        ignore: utils.filesExcludeGlob,
        processor: (input) => {
            // change the namespace if it has an alias
            if (input.includes(`use ${fromNamespace} as `)) {
                return input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace)
            }

            // update the current to alias as we cant correctly update the reference class call
            if (input.includes(`use ${fromNamespace};`)) {
                return input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), `${toNamespace} as ${_from.name}`)
            }

            return input
        }
    })
}

/* Everywhere --------------------------------------------------------------- */

async function updateEverywhereForDirs(
    dirToPath: string,
    fromNamespace: string | undefined,
    toNamespace: string | undefined,
) {
    // stop if moving to / from non-namespace
    if (
        (!fromNamespace && toNamespace) ||
        (fromNamespace && !toNamespace)
    ) {
        utils.showMessage(ERROR_MSG)
        return
    }

    return replace.replaceInFile({
        files: `${getCWD(dirToPath)}/**/*!(blade)${EXT}`,
        ignore: utils.filesExcludeGlob,
        processor: (input) => {
            // if the file is a namespaceable ex."class" & have a namespace declaration
            if (input.match(TYPES_REG) && input.match(NAMESPACE_REG)) {
                input = input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace)
            }

            return input
        }
    })
}

async function updateEverywhereForFiles(fileToPath, _to, _from) {
    let fromNamespace = _from.namespace
    let toNamespace = _to.namespace

    let fromName = _from.name
    let toName = _to.name

    // moved from/to namespace
    return replace.replaceInFile({
        files: `${getCWD(fileToPath)}/**/*!(blade)${EXT}`,
        ignore: utils.filesExcludeGlob,
        processor: (input) => {
            // if the file is a namespaceable ex."class" & have a namespace declaration
            if (input.match(TYPES_REG) && input.match(NAMESPACE_REG)) {
                // if its not an alias then update class call
                if (!input.includes(`use ${fromNamespace} as `)) {
                    input = input.replace(new RegExp(escapeStringRegexp(fromName), 'g'), toName)
                }

                // update namespace
                input = input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace)
            }

            return input
        }
    })
}

/* Helpers ------------------------------------------------------------------ */

async function getNamespaceFromPath(filePath: string) {
    return utils.getFileNamespace(vscode.Uri.file(filePath))
}

function getFQNOnly(text: string | undefined) {
    return text ? text.replace(/(namespace\s+|\n|;)/g, '') : undefined
}

function getCWD(path: string) {
    return vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath
}

async function getFileNameAndNamespace(fileToPath: string, fileFromPath: string) {
    let to_fn = utils.getFileNameFromPath(fileToPath)
    let from_fn = utils.getFileNameFromPath(fileFromPath)

    let to_ns = await getNamespaceFromPath(fileToPath)
    let from_ns = await getNamespaceFromPath(fileFromPath)

    return {
        _from: {
            name: from_fn,
            namespace: from_ns ? (getFQNOnly(from_ns) + '\\' + from_fn) : '',
        },
        _to: {
            name: to_fn,
            namespace: to_ns ? (getFQNOnly(to_ns) + '\\' + to_fn) : '',
        }
    }
}
