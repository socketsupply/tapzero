'use strict';

/** TODO: Copy fast-deep-equal */

type TestFn = (t: Test) => (void | Promise<void>);

interface AssertInfo {
    pass: Boolean,
    actual: unknown,
    expected: unknown,
    description: string,
    operator: string
}

class Test {
    name: string;
    fn: TestFn;

    constructor (name: string, fn: TestFn) {
        this.name = name;
        this.fn = fn;
    }

    deepEqual<T>(actual: T, expected: T, msg?: string): void {}
    equal<T>(actual: T, expected: T, msg?: string): void {
        this._assert({
            pass: actual == expected,
            actual,
            expected,
            description: msg || 'should be equal',
            operator: 'equal'
        })
    }
    fail(msg?: string): void {
        this._assert({
            pass: false,
            actual: 'fail called',
            expected: 'fail not called',
            description: msg || 'fail called',
            operator: 'fail'
        })
    }
    ifError(err: Error, msg?: string): void {
        this._assert({
            pass: !err,
            actual: err,
            expected: 'no error',
            description: msg || String(err),
            operator: 'ifError'
        })
    }
    notDeepEqual<T>(actual: T, expected: T, msg?: string): void {}
    notEqual(actual: unknown, expected: unknown, msg?: string): void {
        this._assert({
            pass: actual != expected,
            actual,
            expected,
            description: msg || 'should not be equal',
            operator: 'equal'
        })
    }

    ok(actual: unknown, msg?: string): void {
        this._assert({
            pass: Boolean(actual),
            actual,
            expected: 'truthy value',
            description: msg || 'should be truthy',
            operator: 'ok'
        })
    }

    _assert(info: AssertInfo) {

    }
}

export class Harness {
    tests: Test[] = [];
    onlyTests: Test[] = [];
    scheduled: boolean = false;
    report?: (lines: string[]) => void

    constructor (report?: (lines: string[]) => void) {
        this.report = report;
    }

    add (name: string, fn: TestFn, only: boolean) {
        const t = new Test(name, fn);
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

export function skip(name: string, fn?: TestFn) {}

function rethrowImmediate (err: Error) {
    setTimeout(() => { throw err; }, 0)
}
