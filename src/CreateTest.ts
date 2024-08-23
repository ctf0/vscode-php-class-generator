import * as vscode from 'vscode';
import * as _file from './CreateFile';
import * as utils from './utils';

export async function createTest(e) {
    const testFolderName = utils.config.testFolderName;

    const selectedTestTypes = await vscode.window.showQuickPick(
        utils.config.testTypes,
        {
            placeHolder: 'choose what types of tests you want to create',
            canPickMany: true,
        },
    );

    if (selectedTestTypes && selectedTestTypes.length) {
        const docPath = e ? e.fsPath : vscode.window.activeTextEditor?.document?.fileName;

        if (docPath) {
            const docName = utils.getFileNameFromPath(docPath);
            const docDir = utils.getDirNameFromPath(docPath);
            const testDir: any = await utils.getTestDirectoryPath(docPath)

            if (testDir) {
                const type = 'class';
                const testName = `${docName}Test`;

                for (const testType of selectedTestTypes) {
                    const testPath = `${testDir}/${testFolderName}/${testType}` + docDir.replace(testDir, '');

                    try {
                        await _file.createFile(testPath, type, testName);
                    } catch (error) {
                        continue;
                    }

                    await _file.insertSnippet(type);
                }
            } else {
                utils.showMessage(`please create a ${testFolderName} folder first`, true);
            }
        }
    } else {
        utils.showMessage('please select a type to create');
    }
}
