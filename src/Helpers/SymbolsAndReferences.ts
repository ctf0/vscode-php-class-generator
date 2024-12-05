import * as vscode from 'vscode';

export function extractMethodSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] | undefined {
    let methods = extractClassSymbols(symbols)?.filter((item) => item.kind === vscode.SymbolKind.Method);

    if (!methods?.length) {
        methods = symbols.filter((symbol: vscode.DocumentSymbol) => symbol.kind === vscode.SymbolKind.Function);
    }

    return methods;
}

export function extractClassSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] | undefined {
    return extractClassOrInterface(symbols)?.children;
}

export function extractClassOrInterface(symbols: vscode.DocumentSymbol[], includeInterface = false): vscode.DocumentSymbol | undefined {
    return symbols.find((symbol: vscode.DocumentSymbol) => {
        const classCheck = symbol.kind === vscode.SymbolKind.Class;

        if (includeInterface) {
            return symbol.kind === vscode.SymbolKind.Interface || classCheck;
        }

        return classCheck;
    });
}

export function getFileSymbols(uri: vscode.Uri): any {
    return vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);
}
