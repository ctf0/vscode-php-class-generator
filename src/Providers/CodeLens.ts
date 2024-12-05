import escapeStringRegexp from 'escape-string-regexp';
import groupBy from 'lodash.groupby';
import path from 'node:path';
import * as vscode from 'vscode';
import * as helpers from '../Helpers/SymbolsAndReferences';
import * as utils from '../Helpers/utils';

export default class CodeLens implements vscode.CodeLensProvider {
    async provideCodeLenses(doc: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const links: any = [];
        const ws = vscode.workspace.workspaceFolders![0].uri.fsPath

        if (!utils.config.showCodeLens || !doc) {
            return links;
        }

        const fileName = doc.fileName;
        let testDir: any = await utils.getTestDirectoryPath(fileName)

        if (!testDir) {
            return links
        }

        const types = utils.config.testTypes.join('|');
        const pathTypes = utils.config.testTypes.map((item) => escapeStringRegexp(`${path.sep}${item}`)).join('|');
        const cmnd = utils.PACKAGE_CMND_NAME;

        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(doc.uri);

        if (symbols) {
            const _classOrInterface: vscode.DocumentSymbol | undefined = helpers.extractClassOrInterface(symbols, true);

            if (_classOrInterface) {
                const name = _classOrInterface.name;
                const range: any = new vscode.Range(_classOrInterface.range.start, _classOrInterface.range.start);

                // go to test
                const testFileName = `${name}Test`;
                testDir = utils.getPathWithoutWs(`${testDir}/${utils.config.testFolderName}`)
                const testFiles = await vscode.workspace.findFiles(`${testDir}/**/${testFileName}.php`);

                if (testFiles.length) {
                    const testFilesFilter = testFiles.filter((file) => file.path.search(pathTypes) !== -1)

                    if (testFilesFilter.length) {
                        const groups = groupBy(testFilesFilter, (file) => file.path.match(types))

                        for (const [type, files] of Object.entries(groups) as [any, any]) {
                            const msg = `$(debug-coverage) Go To Test (${type})`;

                            if (files.length > 1) {
                                links.push(
                                    new vscode.CodeLens(range, {
                                        command: `${cmnd}.open_file_multi`,
                                        title: msg,
                                        arguments: [files, `${testDir}/${type}`],
                                    })
                                );
                            } else {
                                const filePath = files[0].path;

                                links.push(
                                    new vscode.CodeLens(range, {
                                        command: `${cmnd}.open_file`,
                                        title: msg,
                                        tooltip: filePath,
                                        arguments: [filePath],
                                    })
                                );
                            }
                        }
                    } else {
                        const filePath = testFiles[0].path;

                        links.push(
                            new vscode.CodeLens(range, {
                                command: `${cmnd}.open_file`,
                                title: `$(debug-coverage) Go To Test`,
                                tooltip: filePath,
                                arguments: [filePath],
                            })
                        );
                    }
                }

                // go to class
                if (name.endsWith('Test')) {
                    let folderToSearch = utils
                        .getDirNameFromPath(fileName)
                        .replace(new RegExp(`/(${utils.config.testFolderName})(?!.*\b\u0001\b).*`, 'i'), '')

                    const classFileName = name.replace(/Test$/, '');
                    let pattern = `**/${classFileName}.php`

                    if (folderToSearch != ws) {
                        folderToSearch = utils.getPathWithoutWs(folderToSearch)
                        pattern = `${folderToSearch}/${pattern}`
                    }

                    const classFiles = await vscode.workspace.findFiles(pattern);
                    const length = classFiles.length;

                    if (length) {
                        const msg = '$(debug-disconnect) Go To Abstraction';

                        if (length > 1) {
                            links.push(
                                new vscode.CodeLens(range, {
                                    command: `${cmnd}.open_file_multi`,
                                    title: msg,
                                    arguments: [classFiles, folderToSearch],
                                })
                            );
                        } else {
                            const filePath = classFiles[0].path;

                            links.push(
                                new vscode.CodeLens(range, {
                                    command: `${cmnd}.open_file`,
                                    title: msg,
                                    tooltip: filePath,
                                    arguments: [filePath],
                                })
                            );
                        }
                    }
                }
            }
        }

        return links;
    }
}
