'use strict'

// @ts-check

const test = require('@pre-bundled/tape')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const util = require('util')
const jsdiff = require('diff')

const { strip } = require('../util')

const readFile = util.promisify(fs.readFile)

const dir = path.join(__dirname, 'fixtures')
const files = fs.readdirSync(dir)
const JS_FILES = files.filter(f => f.endsWith('.js'))

for (const file of JS_FILES) {
  const fileName = path.join(dir, file)
  test(`test zora/case: ${file}`, (t) => {
    (async () => {
      const info = await exec('node', [fileName])

      const shouldErr = file.endsWith('_fail.js')
      t.equal(info.exitCode, shouldErr ? 1 : 0)

      const stripped = strip(info.combined)

      const expected = await readFile(
        fileName.replace('.js', '_out.txt'), 'utf8'
      )
      equalDiff(t, stripped, expected)
    })().then(t.end, t.end)
  })
}

/**
 * @param {test.Test} t
 * @param {string} actual
 * @param {string} expected
 * @returns {void}
 */
function equalDiff (t, actual, expected) {
  t.equal(actual, expected)
  if (actual !== expected) {
    console.log('\n\n--------------diff:--------------\n')

    const diff = jsdiff.diffChars(actual, expected)
    process.stderr.write(gray('-------------------------\n'))
    diff.forEach(function (part) {
      // green for additions, red for deletions
      // grey for common parts
      let color = null
      if (part.added) color = green
      if (part.removed) color = red

      const str = color !== null ? color(part.value) : part.value
      process.stderr.write(str.replace(/\n/g, '    \n'))
    })
    process.stderr.write(gray('-------------------------\n'))

    console.log('-------raw actual-----')
    console.log(actual)
    console.log('------------------------')
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<{
 *   exitCode: number | null,
 *   stdout: string,
 *   stderr: string,
 *   combined: string
 * }>}
 */
function exec (command, args) {
  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn(command, args)
    let stdout = ''
    let stderr = ''
    let combined = ''

    proc.stdout.on('data', onStdout)
    proc.stderr.on('data', onStderr)
    proc.on('error', (err) => {
      reject(err)
    })

    proc.on('exit', (exitCode) => {
      resolve({
        exitCode, stdout, stderr, combined
      })
    })

    /**
     * @param {Buffer} buf
     * @returns {void}
     */
    function onStdout (buf) {
      const str = buf.toString()
      stdout += str
      combined += str
    }

    /**
     * @param {Buffer} buf
     * @returns {void}
     */
    function onStderr (buf) {
      const str = buf.toString()
      stderr += str
      combined += str
    }
  })
}

/**
 * @param {string} text
 * @returns {string}
 */
function green (text) {
  return '\u001b[32m' + text + '\u001b[0m'
}

/**
 * @param {string} text
 * @returns {string}
 */
function red (text) {
  return '\u001b[31m' + text + '\u001b[0m'
}

/**
 * @param {string} text
 * @returns {string}
 */
function gray (text) {
  return '\u001b[30;1m' + text + '\u001b[0m'
}
