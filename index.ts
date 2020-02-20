'use strict';

/** TODO: Copy fast-deep-equal */

class Test {
    name: string;
    fn: (t: Test) => (void | Promise<void>);

    constructor (name, fn) {
        this.name = name;
        this.fn = fn;
    }

    deepEqual(): void {}
    equal(): void {}
    fail(): void {}
    ifError(): void {}
    notDeepEqual(): void {}
    notEqual(): void {}
    ok(): void {}
}

class Harness {
    tests: Test[] = [];
    onlyTests: Test[] = [];
    scheduled: boolean = false;

    add (t: Test, only: boolean) {
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
test.only = only;
test.skip = skip;
export = test;

function test(name, fn) {
    const t = new Test(name, fn);
    GLOBAL_HARNESS.add(t, false);
}

function only(name, fn) {
    const t = new Test(name, fn);
    GLOBAL_HARNESS.add(t, true);
}

function skip() {}

function rethrowImmediate (err) {
    setTimeout(() => { throw err; }, 0)
}
