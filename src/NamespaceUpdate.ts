import exec from 'await-exec';
import escapeStringRegexp from 'escape-string-regexp';
import glob from 'fast-glob';
import fs from 'fs-extra';
import replace from 'replace-in-file';
import * as vscode from 'vscode';
import * as utils from './utils';

const TYPES = 'class|interface|enum|trait';
const TYPES_REG = new RegExp(TYPES);
const NAMESPACE_REG = /^namespace/m;
const ERROR_MSG = 'nothing changed as we cant correctly update references';
const EXT = '.php';

export default async function updateNamespace(event: vscode.FileRenameEvent) {
    const files = event.files;

    vscode.window.withProgress({
        location    : vscode.ProgressLocation.Notification,
        cancellable : false,
        title       : 'Updating Please Wait',
    }, async () => {
        for (const file of files) {
            const from = file.oldUri.fsPath;
            const to = file.newUri.fsPath;
            const _scheme = await fs.stat(to);

            try {
                if (_scheme.isDirectory()) {
                    await replaceFromNamespaceForDirs(to, from);
                } else {
                    // ignore if not php
                    if (utils.getFileExtFromPath(from) !== EXT || utils.getFileExtFromPath(to) !== EXT) {
                        continue;
                    }

                    // moved to new dir
                    if (utils.getDirNameFromPath(to) !== utils.getDirNameFromPath(from)) {
                        const { _from, _to } = await getFileNameAndNamespace(to, from);

                        if (!_from.namespace || !_to.namespace) {
                            utils.showMessage(ERROR_MSG);
                            continue;
                        }

                        if (await updateFileNamespace(to)) {
                            await updateEverywhereForFiles(to, _to, _from);
                        }
                    }
                    // new file name
                    else {
                        if (await updateFileContentByFileName(to, from)) {
                            await replaceFileNamespaceOnRename(to, from);
                        }
                    }
                }
            } catch (error) {
                // console.error(error)
                break;
            }
        }
    });
}

/* Directory ---------------------------------------------------------------- */

async function replaceFromNamespaceForDirs(dirToPath: string, dirFromPath: string) {
    const checkForPhpFiles = await glob(`**/*!(blade)${EXT}`, { cwd: dirToPath });

    if (!checkForPhpFiles.length) {
        return;
    }

    return updateEverywhereForDirs(dirToPath, dirFromPath);
}

/* Files Move --------------------------------------------------------------- */

async function updateFileNamespace(fileToPath: string) {
    const toNamespace = await getNamespaceFromPath(fileToPath);

    const results: any = await replace.replaceInFile({
        files     : fileToPath,
        // @ts-ignore
        processor : (input: string) => {
            // if it has a namespace then its probably a class
            if (input.match(NAMESPACE_REG)) {
                input = input.replace(new RegExp(/(\n)?^namespace.*(\n)?/, 'm'), toNamespace);
            }

            return input;
        },
    });

    return results[0].hasChanged;
}

/* Files Rename ------------------------------------------------------------- */

async function updateFileContentByFileName(fileToPath: string, fileFromPath: string) {
    const { _from, _to } = await getFileNameAndNamespace(fileToPath, fileFromPath);

    const results: any = await replace.replaceInFile({
        files     : fileToPath,
        // @ts-ignore
        processor : (input: string) => {
            // if it has a namespace then its probably a class
            if (input.match(TYPES_REG) && input.match(NAMESPACE_REG)) {
                // update only the class name & nothing else
                const match = input.match(`(${TYPES}) ${escapeStringRegexp(_from.name)}`);

                if (match) {
                    input = input.replace(match[0], `${match[1]} ${_to.name}`);
                }
            }

            return input;
        },
    });

    return results[0].hasChanged;
}

async function replaceFileNamespaceOnRename(fileToPath: string, fileFromPath: string) {
    const { _from, _to } = await getFileNameAndNamespace(fileToPath, fileFromPath);

    const fromNamespace = _from.namespace;
    const toNamespace = _to.namespace;

    if (!fromNamespace && !toNamespace) {
        return;
    }

    await replace.replaceInFile({
        files     : `${getCWD(fileToPath)}/**/*!(blade)${EXT}`,
        ignore    : utils.filesExcludeGlob,
        // @ts-ignore
        processor : (input: string) => {
            input = input
                // change the namespace if it has an alias
                .replace(new RegExp(`(?<=^use )${escapeStringRegexp(fromNamespace)}(?= as)`, 'gm'), toNamespace)
                // update FQN
                .replace(new RegExp(`(?<!^use )${escapeStringRegexp(fromNamespace)}`, 'gm'), toNamespace);

            return input;
        },
    });

    if (utils.config.openUnchangedFiles) {
        const regex = `^use ${escapeStringRegexp(fromNamespace)};`;
        const cmndResults = await exec(
            utils.config.rgCommand.replace('{REGEX}', `'${regex}' '${getCWD(fileToPath)}'`),
        );
        const paths = cmndResults.stdout.split('\n');

        if (paths.length) {
            for (const path of paths) {
                await utils.openFile(path.replace('\n', ''));
            }
        }
    }

    return;
}

/* Everywhere --------------------------------------------------------------- */

async function updateEverywhereForDirs(
    dirToPath: string,
    dirFromPath: string,
) {
    const fromNamespace = getFQNOnly(await getNamespaceFromPath(dirFromPath + `/ph${EXT}`));
    const toNamespace = getFQNOnly(await getNamespaceFromPath(dirToPath + `/ph${EXT}`));

    if (!fromNamespace && !toNamespace) {
        return;
    }

    // stop if moving to / from non-namespace
    if (
        (!fromNamespace && toNamespace) ||
        (fromNamespace && !toNamespace)
    ) {
        utils.showMessage(ERROR_MSG);

        return;
    }

    return replace.replaceInFile({
        files     : `${getCWD(dirToPath)}/**/*!(blade)${EXT}`,
        ignore    : utils.filesExcludeGlob,
        // @ts-ignore
        processor : (input: string) => input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace),
    });
}

async function updateEverywhereForFiles(
    fileToPath: string,
    _to: { name?: string; namespace: string; },
    _from: { name?: string; namespace: string; },
) {
    const fromNamespace = _from.namespace;
    const toNamespace = _to.namespace;

    // moved from/to namespace
    return replace.replaceInFile({
        files     : `${getCWD(fileToPath)}/**/*!(blade)${EXT}`,
        ignore    : utils.filesExcludeGlob,
        // @ts-ignore
        processor : (input: string) => input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace),
    });
}

/* Helpers ------------------------------------------------------------------ */

async function getNamespaceFromPath(filePath: string) {
    return utils.getFileNamespace(vscode.Uri.file(filePath));
}

function getFQNOnly(text: string | undefined) {
    return text ? text.replace(/(namespace\s+|\n|;)/g, '') : undefined;
}

function getCWD(path: string) {
    return vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath;
}

async function getFileNameAndNamespace(fileToPath: string, fileFromPath: string) {
    const to_fn = utils.getFileNameFromPath(fileToPath);
    const from_fn = utils.getFileNameFromPath(fileFromPath);

    const to_ns = await getNamespaceFromPath(fileToPath);
    const from_ns = await getNamespaceFromPath(fileFromPath);

    return {
        _from: {
            name      : from_fn,
            namespace : from_ns ? (getFQNOnly(from_ns) + '\\' + from_fn) : '',
        },
        _to: {
            name      : to_fn,
            namespace : to_ns ? (getFQNOnly(to_ns) + '\\' + to_fn) : '',
        },
    };
}
