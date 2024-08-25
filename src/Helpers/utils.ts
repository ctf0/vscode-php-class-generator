import { findUp, pathExists } from 'find-up';
import path from 'node:path';
import * as vscode from 'vscode';

export const PACKAGE_CMND_NAME = 'phpclassgen';
export const PACKAGE_NAME = 'phpClassGenerator';
export let config: any;
export let filesExcludeGlob: any;
export let NS_EXTENSION_PROVIDER;

export function getFileNameFromPath(filePath) {
    return path.parse(filePath).name;
}

export function getPathWithoutWs(filePath) {
    const ws = vscode.workspace.workspaceFolders![0].uri.fsPath

    return filePath.replace(ws, '').replace(/^\//, '');
}

export function getDirNameFromPath(filePath) {
    return path.parse(filePath).dir;
}

export function getFileNamespace(uri?: vscode.Uri) {
    try {
        return NS_EXTENSION_PROVIDER.getNamespace(uri);
    } catch (error) {
        // console.error(error);
        return undefined;
    }
}

export function showMessage(msg, error = false, items: any = []) {
    return error
        ? vscode.window.showErrorMessage(`PHP Class Generator: ${msg}`, ...items)
        : vscode.window.showInformationMessage(`PHP Class Generator: ${msg}`, ...items);
}

export async function NsExtensionProviderInit() {
    const nsResolverExtension = vscode.extensions.getExtension('ctf0.php-namespace-resolver');

    if (nsResolverExtension == null) {
        throw new Error('Depends on \'ctf0.php-namespace-resolver\' extension');
    }

    NS_EXTENSION_PROVIDER = await nsResolverExtension.activate();
}

export async function openFile(filePath) {
    return vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(filePath)));
}

export function setConfig() {
    config = vscode.workspace.getConfiguration(PACKAGE_NAME);

    const filesConfig = vscode.workspace.getConfiguration('files');
    const searchConfig = vscode.workspace.getConfiguration('search');
    filesExcludeGlob = [...new Set([
        ...Object.keys(filesConfig.watcherExclude),
        ...Object.keys(searchConfig.exclude),
    ])];
}

export function hasStartOrEndIntersection(selections, DocumentSymbol): any {
    return DocumentSymbol.find((item) => {
        if (selections.find((sel) => item.range.start.line === sel.start.line || item.range.end.line === sel.end.line)) {
            return item;
        }
    });
}

export async function getTestDirectoryPath(docPath: string) {
    const testFolderName = config.testFolderName;

    return await findUp(
        async (directory) => {
            return await pathExists(path.join(directory, testFolderName)) && directory;
        },
        {
            cwd: getDirNameFromPath(docPath),
            type: 'directory',
        },
    );
}
