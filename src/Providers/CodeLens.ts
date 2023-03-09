import * as vscode from 'vscode';
import * as utils from '../utils';

export default class CodeLens implements vscode.CodeLensProvider {
    async provideCodeLenses(doc: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const links: any = [];

        if (!utils.config.showCodeLens) {
            return links;
        }

        const types = utils.config.testTypes.join('|');

        if (doc !== undefined) {
            const text = doc.getText();

            // go to test
            let regex = new RegExp(/(?<=(interface|class)\s)(?!.*Test)(\w+)/g);

            for (const match of text.matchAll(regex)) {
                const found = match[0];
                const testFileName = `${found}Test`;
                // @ts-ignore
                const range: any = doc.getWordRangeAtPosition(doc.positionAt(match.index), /\w+/);

                const files = await vscode.workspace.findFiles(`**/${testFileName}.php`);

                if (files.length) {
                    for (const file of files) {
                        const filePath = file.path;
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
            regex = new RegExp(/(?<=(class)\s)(\w+Test)/g);

            for (const match of text.matchAll(regex)) {
                const found = match[0];
                const classFileName = found.replace(/Test$/, '');
                // @ts-ignore
                const range: any = doc.getWordRangeAtPosition(doc.positionAt(match.index), /\w+/);

                const files = await vscode.workspace.findFiles(`**/${classFileName}.php`);

                if (files.length) {
                    links.push(
                        new vscode.CodeLens(range, {
                            command   : `${utils.PACKAGE_CMND_NAME}.open_test_file`,
                            title     : '$(debug-disconnect) Go To Abstraction',
                            arguments : [files[0].path],
                        }),
                    );
                }
            }
        }

        return links;
    }
}
