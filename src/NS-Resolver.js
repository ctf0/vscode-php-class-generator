/**
 * copy from https://github.com/ctf0/PHP-Namespace-Resolver
 */
let vscode = require('vscode')

class Resolver {
    showMessage(message, error = false) {
        message = message.replace(/\$\(.+?\)\s\s/, '')

        error
            ? vscode.window.showErrorMessage('PHP Class Generator: ' + message)
            : vscode.window.showInformationMessage('PHP Class Generator: ' + message)
    }

    showErrorMessage(message) {
        this.showMessage(message, true)
    }

    async generateNamespace() {
        let compJson   = 'composer.json'
        let currentUri = vscode.window.activeTextEditor.document.uri

        let currentFile     = currentUri.path
        let currentPath     = currentFile.substr(0, currentFile.lastIndexOf('/'))
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(currentUri)

        if (workspaceFolder === undefined) {
            return this.showErrorMessage('No folder openned in workspace, cannot find composer.json')
        }

        // try to retrieve composer file by searching recursively into parent folders of the current file
        let composerFile
        let composerPath = currentFile

        do {
            composerPath = composerPath.substr(0, composerPath.lastIndexOf('/'))
            composerFile = await vscode.workspace.findFiles(new vscode.RelativePattern(composerPath, compJson))
        } while (!composerFile.length && composerPath !== workspaceFolder.uri.path)

        if (!composerFile.length) {
            return this.showErrorMessage('No composer.json file found, namespace generation failed')
        }

        composerFile = composerFile.pop().path

        let document     = await vscode.workspace.openTextDocument(composerFile)
        let composerJson = JSON.parse(document.getText())
        let psr4         = (composerJson.autoload || {})['psr-4']

        if (psr4 === undefined) {
            return this.showErrorMessage('No psr-4 key in composer.json autoload object, automatic namespace generation failed')
        }

        let devPsr4 = (composerJson['autoload-dev'] || {})['psr-4']

        if (devPsr4 !== undefined) {
            psr4 = {...psr4, ...devPsr4}
        }

        let currentRelativePath = currentPath.split(composerPath)[1]

        // this is a way to always match with psr-4 entries
        if (!currentRelativePath.endsWith('/')) {
            currentRelativePath += '/'
        }

        let namespaceBase = Object.keys(psr4)
            .filter((namespaceBase) => currentRelativePath.lastIndexOf(psr4[namespaceBase]) !== -1)[0]

        currentRelativePath = currentRelativePath.replace(/^\//g, '')

        let baseDir = psr4[namespaceBase]

        if (baseDir == currentRelativePath) {
            currentRelativePath = null
        } else {
            currentRelativePath = currentRelativePath
                .replace(baseDir, '')
                .replace(/\/$/g, '')
                .replace(/\//g, '\\')
        }

        namespaceBase = namespaceBase.replace(/\\$/g, '')

        let ns    = null
        let lower = namespaceBase.toLowerCase()

        if (!currentRelativePath || currentRelativePath == lower) { // dir already namespaced
            ns = namespaceBase
        } else { // add parent dir/s to base namespace
            ns = `${namespaceBase}\\${currentRelativePath}`
        }

        ns = ns.replace(/\\{2,}/g, '\\')

        return 'namespace ' + ns + ';'
    }
}

module.exports = Resolver
