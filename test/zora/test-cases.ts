'use strict'

import * as test from '@pre-bundled/tape'
import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process'
import * as util from 'util'
import * as jsdiff from 'diff'

const readFile = util.promisify(fs.readFile)

const dir = path.join(__dirname, 'fixtures')
const files = fs.readdirSync(dir)
const JS_FILES = files.filter(f => f.endsWith('.js'))

for (const file of JS_FILES) {
    const fileName = path.join(dir, file)
    test(`test zora/case: ${file}`, async (t) => {
        const info = await exec('node', [fileName])

        const shouldErr = file.endsWith('_fail.js')
        t.equal(info.exitCode, shouldErr ? 1 : 0)

        const expected = await readFile(
            fileName.replace('.js', '_out.txt'), 'utf8'
        )
        equalDiff(t, info.combined, expected)

        t.end()
    })
}

function equalDiff (
    t: test.Test,
    actual: string,
    expected: string
): void {
    t.equal(actual, expected)
    if (actual !== expected) {
        console.log('\n\n--------------diff:--------------\n')

        var diff = jsdiff.diffChars(actual, expected);
        process.stderr.write(gray('-------------------------\n'))
        diff.forEach(function(part){
            // green for additions, red for deletions
            // grey for common parts
            const color = part.added ? green :
                part.removed ? red : null;

            const str = color ? color(part.value) : part.value
            process.stderr.write(str.replace(/\n/g, '    \n'));
        });
        process.stderr.write(gray('-------------------------\n'))
    }
}

function exec(command: string, args: string[]): Promise<{
    exitCode: number,
    stdout: string,
    stderr: string,
    combined: string
}> {
    return new Promise((resolve, reject) => {
        const proc = child_process.spawn(command, args)
        let stdout = ''
        let stderr = ''
        let combined = ''

        proc.stdout.on('data', (buf) => {
            const str = buf.toString()
            stdout += str
            combined += str
        })
        proc.stderr.on('data', (buf) => {
            const str = buf.toString()
            stderr += str
            combined += str
        })
        proc.on('error', (err: Error) => {
            reject(err)
        })

        proc.on('exit', (exitCode: number) => {
            resolve({
                exitCode, stdout, stderr, combined
            })
        })
    })
}

function green (text: string): string {
    return '\u001b[32m' + text + '\u001b[0m'
}

function red (text: string): string {
    return '\u001b[31m' + text + '\u001b[0m'
}

function gray (text: string): string {
    return '\u001b[30;1m' + text + '\u001b[0m'
}
