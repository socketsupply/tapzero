"use strict";Object.defineProperty(exports, "__esModule", {value: true});'use strict'

var _path = require('path'); var path = _path;

const NUMBER_LINE = /^1\.\.\d+$/
const FAIL_LINE = /^# fail  \d+$/

 function collect (fn) {
    const total = []
    let almostFinished = false

    return function report(line) {
        total.push(line)
        if (line && NUMBER_LINE.test(line)) {
            almostFinished = true
        } else if (almostFinished && (
            line === '# ok' ||
            FAIL_LINE.test(line)
        )){
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
