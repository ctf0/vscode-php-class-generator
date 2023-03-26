import escapeStringRegexp from 'escape-string-regexp';
import path from 'node:path';
import * as vscode from 'vscode';
import * as helpers from '../Symbol/SymbolsAndReferences';
import * as utils from '../utils';

export default class CodeLens implements vscode.CodeLensProvider {
    async provideCodeLenses(doc: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const links: any = [];

        if (!utils.config.showCodeLens || !doc) {
            return links;
        }

        const types = utils.config.testTypes.join('|');
        const pathTypes = utils.config.testTypes.map((item) => escapeStringRegexp(`${path.sep}${item}`)).join('|');

        const symbols: vscode.DocumentSymbol[] | undefined = await helpers.getFileSymbols(doc.uri);

        if (symbols) {
            const _classOrInterface: vscode.DocumentSymbol | undefined = await helpers.extractClassOrInterface(symbols, true);

            if (_classOrInterface) {
                const name = _classOrInterface.name;
                const range: any = new vscode.Range(_classOrInterface.range.start, _classOrInterface.range.start);

                // go to test
                const testFileName = `${name}Test`;
                const testFiles = await vscode.workspace.findFiles(`**/${testFileName}.php`);

                if (testFiles.length) {
                    for (const file of testFiles) {
                        const filePath = file.path;

                        if (filePath.search(pathTypes) !== -1) {
                            const type = filePath.match(types);

                            links.push(
                                new vscode.CodeLens(range, {
                                    command   : `${utils.PACKAGE_CMND_NAME}.open_test_file`,
                                    title     : `$(debug-coverage) Go To Test (${type})`,
                                    arguments : [filePath],
                                }),
                            );
                        }
                    }
                }

                // go to class
                if (name.endsWith('Test')) {
                    const classFileName = name.replace(/Test$/, '');
                    const classFiles = await vscode.workspace.findFiles(`**/${classFileName}.php`);

                    if (classFiles.length) {
                        links.push(
                            new vscode.CodeLens(range, {
                                command   : `${utils.PACKAGE_CMND_NAME}.open_test_file`,
                                title     : '$(debug-disconnect) Go To Abstraction',
                                arguments : [classFiles[0].path],
                            }),
                        );
                    }
                }
            }
        }

        return links;
    }
}
