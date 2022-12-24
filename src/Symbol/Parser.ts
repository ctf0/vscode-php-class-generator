import * as PhpParser from 'php-parser';
import * as vscode from 'vscode';

const Parser = new PhpParser.Engine({
    parser: {
        extractDoc: true,
    },
    ast: {
        withPositions: true,
    },
});

export function getAllMethodsOrFunctions(content: string) {
    try {
        const AST = Parser.parseCode(content, '*.php');
        const _class = getClass(AST?.children?.find((item: any) => item.kind == 'namespace') || AST);

        if (_class) {
            return _class.body.filter((item: any) => item.kind == 'method');
        } else {
            return getFunctions(AST);
        }
    } catch (error) {
        // console.error(error);
    }
}

function getClass(AST) {
    return AST?.children?.find((item: any) => item.kind == 'class');
}

function getFunctions(AST) {
    const filterExtra = AST?.children?.filter((item: any) => !new RegExp(/declare|usegroup|expressionstatement|function/).test(item.kind));

    return AST?.children
        ?.filter((item: any) => item.kind == 'function')
        .concat(getFunctionsLookup(filterExtra))
        .flat()
        .filter((e) => e);
}

function getFunctionsLookup(filterExtra) {
    const list: any = [];

    for (const item of filterExtra) {
        list.push(item.body?.children?.filter((item: any) => item.kind == 'function'));
    }

    return list;
}

export function getRangeFromLoc(start: { line: number; column: number; }, end: { line: number; column: number; }): vscode.Range {
    return new vscode.Range(
        new vscode.Position(start.line - 1, start.column),
        new vscode.Position(end.line - 1, end.column),
    );
}
