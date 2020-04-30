'use strict';

// @ts-check

/**
 * TODO: @Raynos ; change the jsdoc plugin about class fields
 * TODO: @Raynos ; add support for callsites to type-coverage
 */

const deepEqual = require('./fast-deep-equal')

const NEW_LINE_REGEX = /\n/g
const OBJ_TO_STRING = Object.prototype.toString;
const AT_REGEX = new RegExp(
    // non-capturing group for 'at '
    '^(?:[^\\s]*\\s*\\bat\\s+)' +
    // captures function call description
    '(?:(.*)\\s+\\()?' +
    // captures file path plus line no
    '((?:\\/|[a-zA-Z]:\\\\)[^:\\)]+:(\\d+)(?::(\\d+))?)\\)$'
)

/**
 * @typedef {(t: Test) => (void | Promise<void>)} TestFn
 */

/**
 * @class
 */
class Test {
    /**
     * @constructor
     * @param {string} name
     * @param {TestFn} fn
     * @param {Harness} h
     */
    constructor (name, fn, h) {
        /** @type {string} */
        this.name = name;
        /** @type {TestFn} */
        this.fn = fn;
        /** @type {Harness} */
        this.harness = h;
        /** @type {{ pass: number, fail: number }} */
        this._result = {
            pass: 0,
            fail: 0
        }
        /** @type {boolean} */
        this.done = false
    }

    /**
     * @param {string} msg
     * @returns {void}
     */
    comment(msg) {
        this.harness.report('# ' + msg)
    }

    /**
     * @template T
     * @param {T} actual
     * @param {T} expected
     * @param {string} [msg]
     * @returns {void}
     */
    deepEqual(actual, expected, msg) {
        // deepEqual('foo', 'bar')
        this._assert(
            deepEqual(actual, expected), actual, expected,
            msg || 'should be equivalent', 'deepEqual'
        )
    }

    /**
     * @template T
     * @param {T} actual
     * @param {T} expected
     * @param {string} [msg]
     * @returns {void}
     */
    notDeepEqual(actual, expected, msg) {
        this._assert(
            !deepEqual(actual, expected), actual, expected,
            msg || 'should not be equivalent', 'notDeepEqual'
        )
    }

    /**
     * @template T
     * @param {T} actual
     * @param {T} expected
     * @param {string} [msg]
     * @returns {void}
     */
    equal(actual, expected, msg) {
        this._assert(
            actual == expected, actual, expected,
            msg || 'should be equal', 'equal'
        )
    }

    /**
     * @param {unknown} actual
     * @param {unknown} expected
     * @param {string} [msg]
     * @returns {void}
     */
    notEqual(actual, expected, msg) {
        this._assert(
            actual != expected, actual, expected,
            msg || 'should not be equal', 'notEqual'
        )
    }

    /**
     * @param {string} [msg]
     * @returns {void}
     */
    fail(msg) {
        this._assert(
            false, 'fail called', 'fail not called',
            msg || 'fail called', 'fail'
        )
    }

    /**
     * @param {unknown} actual
     * @param {string} [msg]
     * @returns {void}
     */
    ok(actual, msg) {
        this._assert(
            !!actual, actual, 'truthy value',
            msg || 'should be truthy', 'ok'
        )
    }

    /**
     * @param {Error | null} err
     * @param {string} [msg]
     * @returns {void}
     */
    ifError(err, msg) {
        this._assert(
            !err, err, 'no error', msg || String(err), 'ifError'
        )
    }

    /**
     * @param {boolean} pass
     * @param {unknown} actual
     * @param {unknown} expected
     * @param {string} description
     * @param {string} operator
     * @returns {void}
     */
    _assert(
        pass, actual, expected,
        description, operator
    ) {
        if (this.done) {
            throw new Error(
                'assertion occurred after test was finished: ' + this.name
            )
        }

        const report = this.harness.report

        const prefix = pass ? 'ok' : 'not ok'
        const id = this.harness.nextId()
        report(`${prefix} ${id} ${description}`)

        if (pass) {
            this._result.pass++
            return
        }

        const atErr = new Error(description)
        let err = atErr
        if (actual && OBJ_TO_STRING.call(actual) === '[object Error]') {
            err = /** @type {Error} */ (actual)
            actual = err.message
        }

        this._result.fail++
        report('  ---')
        report(`    operator: ${operator}`)

        let ex = JSON.stringify(expected, null, '  ')
        let ac = JSON.stringify(actual, null, '  ')
        if (Math.max(ex.length, ac.length) > 65) {
            ex = ex.replace(NEW_LINE_REGEX, '\n      ')
            ac = ac.replace(NEW_LINE_REGEX, '\n      ')

            report(`    expected: |-\n      ${ex}`)
            report(`    actual:   |-\n      ${ac}`)
        } else {
            report(`    expected: ${ex}`)
            report(`    actual:   ${ac}`)
        }

        const at = findAtLineFromError(atErr)
        if (at) {
            report(`    at:       ${at}`)
        }

        report(`    stack:    |-`)
        const st = (err.stack || '').split('\n')
        for (const line of st) {
            report(`      ${line}`)
        }

        report('  ...')
    }

    /**
     * @returns {Promise<{
     *   pass: number,
     *   fail: number
     * }>}
     */
    async run () {
        this.harness.report('# ' + this.name)
        const maybeP = this.fn(this);
        if (maybeP && typeof maybeP.then === 'function') {
            await maybeP
        }
        this.done = true
        return this._result
    }
}

/**
 * @param {Error} e
 * @returns {string}
 */
function findAtLineFromError(e) {
    var lines = (e.stack || '').split('\n');
    var dir = __dirname;

    for (const line of lines) {
        var m = AT_REGEX.exec(line);
        if (!m) {
            continue;
        }

        if (m[2].slice(0, dir.length) === dir) {
            continue
        }

        return `${m[1] || '<anonymous>'} (${m[2]})`
    }
    return ''
}

/**
 * @class
 */
class Harness {
    /**
     * @constructor
     * @param {(lines: string) => void} [report]
     */
    constructor (report) {
        /** @type {(lines: string) => void} */
        this.report = report || printLine;

        /** @type {Test[]} */
        this.tests = [];
        /** @type {Test[]} */
        this.onlyTests = [];
        /** @type {boolean} */
        this.scheduled = false;
        /** @type {number} */
        this._id = 0;
    }

    /**
     * @returns {string}
     */
    nextId () {
        return String(++this._id)
    }

    /**
     * @param {string} name
     * @param {TestFn} fn
     * @param {boolean} only
     * @returns {void}
     */
    add (name, fn, only) {
        // TODO: calling add() after run()
        const self = this
        const t = new Test(name, fn, this);
        const arr = only ? this.onlyTests : this.tests;
        arr.push(t);
        if (!this.scheduled) {
            this.scheduled = true;
            process.nextTick(run);
        }

        function run () {
            self.run().then(null, rethrowImmediate);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async run () {
        const ts = this.onlyTests.length > 0 ?
            this.onlyTests : this.tests

        this.report('TAP version 13')

        let total = 0
        let success = 0
        let fail = 0

        for (const test of ts) {
            // TODO: parallel execution
            const result = await test.run()

            total += result.fail + result.pass
            success += result.pass
            fail += result.fail
        }

        this.report('')
        this.report(`1..${total}`)
        this.report(`# tests ${total}`)
        this.report(`# pass  ${success}`)
        if (fail) {
            this.report(`# fail  ${fail}`)
        } else {
            this.report('')
            this.report('# ok')
        }
        // TODO: exitCode
    }
}
exports.Harness = Harness

/**
 * @param {string} line
 * @returns {void}
 */
function printLine(line) {
    console.log(line)
}

const GLOBAL_HARNESS = new Harness();

/**
 * @param {string} name
 * @param {TestFn} [fn]
 * @returns {void}
 */
function test(name, fn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, false);
}
exports.test = test

/**
 * @param {string} name
 * @param {TestFn} [fn]
 * @returns {void}
 */
function only(name, fn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, true);
}
exports.only = only

/**
 * @param {string} _name
 * @param {TestFn} [_fn]
 * @returns {void}
 */
function skip(_name, _fn) {}
exports.skip = skip

/**
 * @param {Error} err
 * @returns {void}
 */
function rethrowImmediate (err) {
    process.nextTick(rethrow)

    function rethrow () { throw err; }
}
