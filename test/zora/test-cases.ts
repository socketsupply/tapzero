'use strict'

import * as test from '@pre-bundled/tape'
import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import * as util from 'util'

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
