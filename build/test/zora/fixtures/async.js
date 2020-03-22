"use strict";const test = require('../../../src/index').test

const wait = time => new Promise(resolve => {
    setTimeout(() => resolve(), time);
});

test('tester 1', async t => {
    t.ok(true, 'assert1');
    // await wait(50);
    t.ok(true, 'assert2');
});

test('tester 2', async t => {
    t.ok(true, 'assert3');
    // await wait(30);
    t.ok(true, 'assert4');
});
