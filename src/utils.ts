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

export function getFileExtFromPath(filePath) {
    return path.parse(filePath).ext;
}

export function getDirNameFromPath(filePath) {
    return path.parse(filePath).dir;
}

export async function getFileNamespace(uri: any = null) {
    return NS_EXTENSION_PROVIDER.getNamespace(uri);
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
