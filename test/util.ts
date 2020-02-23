'use strict'

import * as path from 'path'

export function collect (fn: (a: string) => void) {
    const total: string[] = []

    return function report(lines: string[]) {
        for (const line of lines) {
            const moreLines = line.split('\n')
            total.push(...moreLines)
        }
        if (lines[0] && lines[0].startsWith('\n1..')) {
            fn(strip(total.join('\n')))
        }
    }
}

export function strip (line: string) {
    var withoutTestDir = line.replace(
        new RegExp(__dirname, 'g'), '$TEST'
    );
    var withoutPackageDir = withoutTestDir.replace(
        new RegExp(path.dirname(__dirname), 'g'), '$TAPE'
    );
    var withoutPathSep = withoutPackageDir.replace(
        new RegExp('\\' + path.sep, 'g'), '/'
    );
    var withoutLineNumbers = withoutPathSep.replace(
        /:\d+:\d+/g, ':$LINE:$COL'
    );
    var withoutNestedLineNumbers = withoutLineNumbers.replace(
        /, \<anonymous\>:\$LINE:\$COL\)$/, ')'
    );
    return withoutNestedLineNumbers;
}

export function trimPrefix (text: TemplateStringsArray) {
    const lines = text[0].split('\n')
    let commonPrefix = Infinity
    for (const line of lines) {
        if (line === '' || line.trim() === '') continue
        const prefix = line.search(/\S|$/)
        if (prefix < commonPrefix) {
            commonPrefix = prefix
        }
    }

    let result = []
    for (const line of lines) {
        result.push(line.slice(commonPrefix))
    }

    return result.join('\n').trim()
}
