import pRetry from 'p-retry';
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

export async function getFileSymbols(uri: vscode.Uri): Promise<any> {
    const wait = 500;

    return pRetry(async () => {
        const data: any = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);

        if (!data) {
            await new Promise((r) => setTimeout(r, wait));
            throw new Error('nothing found');
        }

        return data;
    }, { retries: 5 });
}
