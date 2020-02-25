"use strict";Object.defineProperty(exports, "__esModule", {value: true});'use strict';

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





class Test {
    
    
    
    
    

    constructor (name, fn, h) {
        this.name = name;
        this.fn = fn;
        this.harness = h;
        this._result = {
            lines: ['# ' + name],
            pass: 0,
            fail: 0
        }
        this.done = false
    }

    comment(msg) {
        this._result.lines.push('# ' + msg)
    }

    deepEqual(actual, expected, msg) {
        this._assert(
            deepEqual(actual, expected), actual, expected,
            msg || 'should be equivalent', 'deepEqual'
        )
    }
    notDeepEqual(actual, expected, msg) {
        this._assert(
            !deepEqual(actual, expected), actual, expected,
            msg || 'should not be equivalent', 'notDeepEqual'
        )
    }
    equal(actual, expected, msg) {
        this._assert(
            actual == expected, actual, expected,
            msg || 'should be equal', 'equal'
        )
    }
    notEqual(actual, expected, msg) {
        this._assert(
            actual != expected, actual, expected,
            msg || 'should not be equal', 'notEqual'
        )
    }
    fail(msg) {
        this._assert(
            false, 'fail called', 'fail not called',
            msg || 'fail called', 'fail'
        )
    }
    ok(actual, msg) {
        this._assert(
            !!actual, actual, 'truthy value',
            msg || 'should be truthy', 'ok'
        )
    }
    ifError(err, msg) {
        this._assert(
            !err, err, 'no error', msg || String(err), 'ifError'
        )
    }
    _assert(
        pass, actual, expected,
        description, operator
    ) {
        if (this.done) {
            throw new Error(
                'assertion occurred after test was finished: ' + this.name
            )
        }

        const lines = this._result.lines

        const prefix = pass ? 'ok' : 'not ok'
        const id = this.harness.nextId()
        lines.push(`${prefix} ${id} ${description}`)

        if (pass) {
            this._result.pass++
            return
        }

        const atErr = new Error(description)
        let err = atErr
        if (actual && OBJ_TO_STRING.call(actual) === '[object Error]') {
            err =  actual
            actual = err.message
        }

        this._result.fail++
        lines.push('  ---')
        lines.push(`    operator: ${operator}`)

        let ex = JSON.stringify(expected, null, '  ')
        let ac = JSON.stringify(actual, null, '  ')
        if (Math.max(ex.length, ac.length) > 65) {
            ex = ex.replace(NEW_LINE_REGEX, '\n      ')
            ac = ac.replace(NEW_LINE_REGEX, '\n      ')

            lines.push(`    expected: |-\n      ${ex}`)
            lines.push(`    actual:   |-\n      ${ac}`)
        } else {
            lines.push(`    expected: ${ex}`)
            lines.push(`    actual:   ${ac}`)
        }

        const at = findAtLineFromError(atErr)
        if (at) {
            lines.push(`    at:       ${at}`)
        }

        lines.push(`    stack:    |-`)
        const st = (err.stack || '').split('\n')
        for (const line of st) {
            lines.push(`      ${line}`)
        }

        lines.push('  ...')
    }

    async run () {
        const maybeP = this.fn(this);
        if (maybeP && typeof maybeP.then === 'function') {
            await maybeP
        }
        this.done = true
        return this._result
    }
}

function findAtLineFromError(e) {
    var err = (e.stack || '').split('\n');
    var dir = __dirname;

    for (var i = 0; i < err.length; i++) {
        var m = AT_REGEX.exec(err[i]);
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

 class Harness {
    
    
    
    
     

    constructor (report) {
        this.report = report || printLines;
        this.tests = [];
        this.onlyTests = [];
        this.scheduled = false;
        this._id = 0;
    }

    nextId () {
        return String(++this._id)
    }

    add (name, fn, only) {
        // TODO: calling add() after run()
        const t = new Test(name, fn, this);
        const arr = only ? this.onlyTests : this.tests;
        arr.push(t);
        if (!this.scheduled) {
            this.scheduled = true;
            setTimeout(() => {
                this.run().then(null, rethrowImmediate);
            }, 0);
        }
    }

    async run () {
        const ts = this.onlyTests.length > 0 ?
            this.onlyTests : this.tests

        this.report(['TAP version 13'])

        let total = 0
        let success = 0
        let fail = 0

        for (const test of ts) {
            // TODO: parallel execution
            const result = await test.run()
            // TODO: Stream output of test lines.
            this.report(result.lines)

            total += result.fail + result.pass
            success += result.pass
            fail += result.fail
        }

        this.report([
            `\n1..${total}`,
            `# tests ${total}`,
            `# pass  ${success}`,
            fail > 0 ? `# fail  ${fail}` : '\n# ok'
        ])
        // TODO: exitCode
    }
} exports.Harness = Harness;

function printLines(lines) {
    for (const line of lines) {
        console.log(line)
    }
}

const GLOBAL_HARNESS = new Harness();

 function test(name, fn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, false);
} exports.test = test;

 function only(name, fn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, true);
} exports.only = only;

 function skip(_name, _fn) {} exports.skip = skip;

function rethrowImmediate (err) {
    setTimeout(() => { throw err; }, 0)
}
