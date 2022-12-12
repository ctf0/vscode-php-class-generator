import pRetry from 'p-retry';
import * as vscode from 'vscode';

export function extractNeededSymbols(symbols: vscode.DocumentSymbol[]): {
    _namespace: vscode.DocumentSymbol | undefined;
    _class: vscode.DocumentSymbol | undefined;
} {
    return {
        _namespace : symbols.find((symbol: vscode.DocumentSymbol) => symbol.kind === vscode.SymbolKind.Namespace),
        _class     : symbols.find((symbol: vscode.DocumentSymbol) => symbol.kind === vscode.SymbolKind.Class),
    };
}

export async function getFileSymbols(toUri): Promise<any> {
    const wait = 500;

    return pRetry(async () => {
        const data: any = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', toUri);

        if (!data) {
            await new Promise((r) => setTimeout(r, wait));
            throw new Error('nothing found');
        }

        return data;
    }, { retries: 5 });
}

export async function getReferences(uri, position): Promise<void> {
    const wait = 1000;

    return pRetry(async () => {
        let retry = false;
        const data: any = await vscode.commands.executeCommand('vscode.executeReferenceProvider', uri, position);

        if (
            !data ||
            (data && data.length == 1 && data[0].uri.path === uri.path)
        ) {
            retry = true;
        }

        if (retry) {
            await new Promise((r) => setTimeout(r, wait));
            throw new Error('nothing found');
        }

        return data;
    }, { retries: 5 });
}

export async function updateReferences(
    refs: any,
    newClassName: string,
    newNameSpace: string,
    oldClassName: string,
): Promise<any[]> {
    return Promise.all(
        refs.map(async (ref) => {
            const isANamespace = (ref.range.end.character - ref.range.start.character) > oldClassName.length;

            const edit = new vscode.WorkspaceEdit();
            edit.replace(ref.uri, ref.range, isANamespace ? newNameSpace : newClassName);

            await vscode.workspace.applyEdit(edit, { isRefactoring: true });
        }),
    );
}

export async function updateNamespaceOnlyReferences(
    refs: any,
    oldNamespace: string,
    newNamespace: string,
): Promise<any[]> {
    return Promise.all(
        refs
            .filter((ref) => (ref.range.end.character - ref.range.start.character) == oldNamespace.length)
            .map((ref) => {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(ref.uri, ref.range, newNamespace);

                return vscode.workspace.applyEdit(edit, { isRefactoring: true });
            }),
    );
}
