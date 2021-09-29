// @ts-nocheck
const test = require('../../../index').test

const wait = time => new Promise(resolve => {
    setTimeout(() => resolve(), time);
});

test('tester sync', async t => {
    t.ok(true, 'assert1');
});

setTimeout(() => {
  test('tester 2', async t => {
    t.ok(true, 'assert3');
  });
}, 10)

