import escapeStringRegexp from 'escape-string-regexp';
import glob from 'fast-glob';
import fs from 'fs-extra';
import replace from 'replace-in-file';
import * as vscode from 'vscode';
import * as utils from '../utils';
import * as helpers from './SymbolsAndReferences';

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
                        await updateFileReferencesNamespace(file.newUri);
                        await updateFileOwnNamespace(file.newUri);
                    }
                    // new file name
                    else {
                        await updateFileOnRename(file.newUri);
                    }
                }
            } catch (error) {
                // console.error(error)
                break;
            }
        }
    });
}

/* -------------------------------------------------------------------------- */
/*                                  DIRECTORY                                 */
/* -------------------------------------------------------------------------- */

async function replaceFromNamespaceForDirs(dirToPath: string, dirFromPath: string) {
    const checkForPhpFiles = await glob(`**/*!(blade)${EXT}`, { cwd: dirToPath });

    if (!checkForPhpFiles.length) {
        return;
    }

    const _from_ns = await getNamespaceFromPath(dirFromPath + `/ph${EXT}`);
    const _to_ns = await getNamespaceFromPath(dirToPath + `/ph${EXT}`);

    await updateEverywhereForDirs(
        dirToPath,
        getFQNOnly(_from_ns),
        getFQNOnly(_to_ns),
    );
}

/* -------------------------------------------------------------------------- */
/*                                    FILES                                   */
/* -------------------------------------------------------------------------- */

/* Move --------------------------------------------------------------------- */
async function updateFileReferencesNamespace(toUri: vscode.Uri): Promise<void> {
    const symbols: vscode.DocumentSymbol[] = await helpers.getFileSymbols(toUri);

    if (symbols) {
        const { _namespace, _class } = await helpers.extractNeededSymbols(symbols);

        if (_namespace && _class) {
            const refs: any = await helpers.getReferences(toUri, _class.selectionRange.start);

            if (refs.length) {
                const toNamespace = getFQNOnly(await utils.getFileNamespace(toUri)) || '';
                const className = _class.name;
                const oldFQN = `${_namespace.name}\\${className}`;
                const newFQN = `${toNamespace}\\${className}`;

                await helpers.updateNamespaceOnlyReferences(refs, oldFQN, newFQN);
            }
        }
    }
}

async function updateFileOwnNamespace(toUri: vscode.Uri) {
    const toNamespace = await utils.getFileNamespace(toUri);

    return replace.replaceInFile({
        files     : toUri.fsPath,
        processor : (input) => {
            // if it has a namespace then its probably a class
            if (input.match(NAMESPACE_REG)) {
                input = input.replace(new RegExp(/(\n)?^namespace.*(\n)?/, 'm'), toNamespace);
            }

            return input;
        },
    });
}

/* Rename ------------------------------------------------------------------- */
async function updateFileOnRename(toUri: vscode.Uri) {
    const symbols: vscode.DocumentSymbol[] = await helpers.getFileSymbols(toUri);

    if (symbols) {
        const { _namespace, _class } = await helpers.extractNeededSymbols(symbols);

        if (_namespace && _class) {
            const refs: any = await helpers.getReferences(toUri, _class.selectionRange.start);

            if (refs.length) {
                const newClassName = utils.getFileNameFromPath(toUri.fsPath);

                await helpers.updateReferences(
                    refs,
                    newClassName,
                    `${_namespace.name}\\${newClassName}`,
                    _class.name,
                );
            }
        }
    }
}

async function updateEverywhereForDirs(
    dirToPath: string,
    fromNamespace: string | undefined,
    toNamespace: string | undefined,
) {
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
        processor : (input) => {
            // if the file is a namespaceable ex."class" & have a namespace declaration
            if (input.match(TYPES_REG) && input.match(NAMESPACE_REG)) {
                input = input.replace(new RegExp(escapeStringRegexp(fromNamespace), 'g'), toNamespace);
            }

            return input;
        },
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
