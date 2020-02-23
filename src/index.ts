'use strict';

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

type TestFn = (t: Test) => (void | Promise<void>);
type TestRes = { lines: string[], pass: number, fail: number }


class Test {
    name: string;
    fn: TestFn;
    harness: Harness;
    _result: TestRes
    done: Boolean;

    constructor (name: string, fn: TestFn, h: Harness) {
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

    comment(msg: string): void {
        this._result.lines.push('# ' + msg)
    }

    deepEqual<T>(actual: T, expected: T, msg?: string): void {
        this._assert(
            deepEqual(actual, expected), actual, expected,
            msg || 'should be equivalent', 'deepEqual'
        )
    }
    notDeepEqual<T>(actual: T, expected: T, msg?: string): void {
        this._assert(
            !deepEqual(actual, expected), actual, expected,
            msg || 'should not be equivalent', 'notDeepEqual'
        )
    }
    equal<T>(actual: T, expected: T, msg?: string): void {
        this._assert(
            actual == expected, actual, expected,
            msg || 'should be equal', 'equal'
        )
    }
    notEqual(actual: unknown, expected: unknown, msg?: string): void {
        this._assert(
            actual != expected, actual, expected,
            msg || 'should not be equal', 'notEqual'
        )
    }
    fail(msg?: string): void {
        this._assert(
            false, 'fail called', 'fail not called',
            msg || 'fail called', 'fail'
        )
    }
    ok(actual: unknown, msg?: string): void {
        this._assert(
            !!actual, actual, 'truthy value',
            msg || 'should be truthy', 'ok'
        )
    }
    ifError(err?: Error | null, msg?: string): void {
        this._assert(
            !err, err, 'no error', msg || String(err), 'ifError'
        )
    }
    _assert(
        pass: Boolean, actual: unknown, expected: unknown,
        description: string, operator: string
    ): void {
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
            err = <Error> actual
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

    async run (): Promise<TestRes> {
        const maybeP = this.fn(this);
        if (maybeP && typeof maybeP.then === 'function') {
            await maybeP
        }
        this.done = true
        return this._result
    }
}

function findAtLineFromError(e: Error): string {
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

export class Harness {
    tests: Test[];
    onlyTests: Test[];
    scheduled: boolean;
    report: (lines: string[]) => void
    private _id: number ;

    constructor (report?: (lines: string[]) => void) {
        this.report = report || printLines;
        this.tests = [];
        this.onlyTests = [];
        this.scheduled = false;
        this._id = 0;
    }

    nextId (): string {
        return String(++this._id)
    }

    add (name: string, fn: TestFn, only: boolean) {
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

    async run (): Promise<void> {
        const ts = this.onlyTests.length > 0 ?
            this.onlyTests : this.tests

        this.report(['TAP version 13'])

        let total = 0
        let success = 0
        let fail = 0

        for (const test of ts) {
            // TODO: parallel execution
            const result = await test.run()
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
    }
}

function printLines(lines: string[]) {
    for (const line of lines) {
        console.log(line)
    }
}

const GLOBAL_HARNESS = new Harness();

export function test(name: string, fn?: TestFn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, false);
}

export function only(name: string, fn?: TestFn) {
    if (!fn) return
    GLOBAL_HARNESS.add(name, fn, true);
}

export function skip(_name: string, _fn?: TestFn) {}

function rethrowImmediate (err: Error) {
    setTimeout(() => { throw err; }, 0)
}
