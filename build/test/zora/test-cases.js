"use strict";'use strict'

var _tape = require('@pre-bundled/tape'); var test = _tape;
var _fs = require('fs'); var fs = _fs;
var _path = require('path'); var path = _path;
var _child_process = require('child_process'); var child_process = _child_process;
var _util = require('util'); var util = _util;

const exec = util.promisify(child_process.exec)
const readFile = util.promisify(fs.readFile)

const dir = path.join(__dirname, 'fixtures')
const files = fs.readdirSync(dir)
const JS_FILES = files.filter(f => f.endsWith('.js'))

for (const file of JS_FILES) {
    const fileName = path.join(dir, file)
    test(`test zora/case: ${file}`, async (t) => {
        let info
        try {
            info = await exec(`node ${fileName}`)
        } catch (err) {
            t.ifErr(err)
            return
        }

        const expected = await readFile(
            fileName.replace('.js', '_out.txt'), 'utf8'
        )
        t.equal(info.stdout, expected)

        t.end()
    })
}
