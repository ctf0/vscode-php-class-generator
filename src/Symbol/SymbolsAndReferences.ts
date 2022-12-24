import * as vscode from 'vscode';

export function extractNeededSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
    let methods = symbols
        .find((symbol: vscode.DocumentSymbol) => symbol.kind === vscode.SymbolKind.Class)?.children
        .filter((item) => item.kind === vscode.SymbolKind.Method);

    if (!methods?.length) {
        methods = symbols.filter((symbol: vscode.DocumentSymbol) => symbol.kind === vscode.SymbolKind.Function);
    }

    return methods;
}

export async function getFileSymbols(uri: vscode.Uri): Promise<vscode.DocumentSymbol[] | undefined> {
    return vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);
}
