import {
    CodeLens,
    CodeLensProvider,
    TextDocument,
    window,
    workspace
} from 'vscode'
import * as utils from '../utils'

export default class lensProvider implements CodeLensProvider {
    async provideCodeLenses(doc: TextDocument): Promise<CodeLens[]> {
        let editor = window.activeTextEditor
        let links = []

        if (editor) {
            const text  = doc.getText()

            // go to test
            let regex = new RegExp(/(?<=(interface|class)\s)(?!.*Test)(\w+)/g)

            for (const match of text.matchAll(regex)) {
                const found        = match[0]
                const testFileName = `${found}Test`
                const range: any   = doc.getWordRangeAtPosition(doc.positionAt(match.index), /\w+/)

                let files = await workspace.findFiles(`**/${testFileName}.php`)

                if (files.length) {
                    links.push(
                        new CodeLens(range, {
                            command: `${utils.PACKAGE_CMND_NAME}.open_test_file`,
                            title     : `$(debug-coverage) Go To Test`,
                            arguments : [files[0].path]
                        })
                    )
                }
            }

            // go to class
            regex = new RegExp(/(?<=(class)\s)(\w+Test)/g)

            for (const match of text.matchAll(regex)) {
                const found        = match[0]
                const classFileName = found.replace(/Test$/, '')
                const range: any   = doc.getWordRangeAtPosition(doc.positionAt(match.index), /\w+/)

                let files = await workspace.findFiles(`**/${classFileName}.php`)

                if (files.length) {
                    links.push(
                        new CodeLens(range, {
                            command: `${utils.PACKAGE_CMND_NAME}.open_test_file`,
                            title     : `$(debug-disconnect) Go To Abstraction`,
                            arguments : [files[0].path]
                        })
                    )
                }
            }
        }

        return links
    }
}
