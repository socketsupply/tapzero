"use strict";Object.defineProperty(exports, "__esModule", {value: true});'use strict'

var _path = require('path'); var path = _path;

 function collect (fn) {
    const total = []

    return function report(lines) {
        for (const line of lines) {
            const moreLines = line.split('\n')
            total.push(...moreLines)
        }
        if (lines[0] && lines[0].startsWith('\n1..')) {
            fn(strip(total.join('\n')))
        }
    }
} exports.collect = collect;

 function strip (line) {
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
} exports.strip = strip;

 function trimPrefix (text) {
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
} exports.trimPrefix = trimPrefix;
