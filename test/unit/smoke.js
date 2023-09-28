'use strict'

// @ts-check

const test = require('@pre-bundled/tape')

const { TestRunner } = require('../../index.js')
const { collect, trimPrefix } = require('../util.js')

test('tapzero outputs TAP', (assert) => {
  const h = new TestRunner(collect(verify))
  h.add('one', (t) => {
    t.ok(true)
  }, true)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.deepEqual(actual, trimPrefix`
        TAP version 13
        # one
        ok 1 should be truthy

        1..1
        # tests 1
        # pass  1

        # ok`
    )
    assert.end()
  }
})

test('tapzero with two blocks', (assert) => {
  const h = new TestRunner(collect(verify))
  h.add('one', (t) => {
    t.ok(true)
  }, true)
  h.add('two', (t) => {
    t.ok(true, 'this test passes')
  }, true)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.deepEqual(actual, trimPrefix`
        TAP version 13
        # one
        ok 1 should be truthy
        # two
        ok 2 this test passes

        1..2
        # tests 2
        # pass  2

        # ok`
    )
    assert.end()
  }
})

test('zerotap handles failures', (assert) => {
  const h = new TestRunner(collect(verify))
  h.add('zero', (t) => {
    t.ok(true)
  }, true)
  h.add('passing', (t) => {
    t.ok(true, 'this test passes')
  }, true)
  h.add('two', function _ (t) {
    t.equal('one', 'two', 'this test fails')
  }, true)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # zero
        ok 1 should be truthy
        # passing
        ok 2 this test passes
        # two
        not ok 3 this test fails
          ---
            operator: equal
            expected: "two"
            actual:   "one"
            at:       Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
            stack:    |-
              Error: this test fails
                  at Test._assert ($TAPE/index.js:$LINE:$COL)
                  at Test.equal ($TAPE/index.js:$LINE:$COL)
                  at Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
                  at Test.run ($TAPE/index.js:$LINE:$COL)
                  at TestRunner.run ($TAPE/index.js:$LINE:$COL)
          ...

        1..3
        # tests 3
        # pass  2
        # fail  1
        `)
    assert.end()
  }
})

test('zerotap handles errors', (assert) => {
  const h = new TestRunner(collect(verify))
  h.add('zero', function _ (t) {
    t.ifError(new Error('foo'))
  }, true)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # zero
        not ok 1 Error: foo
          ---
            operator: ifError
            expected: "no error"
            actual:   "foo"
            at:       Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
            stack:    |-
              Error: foo
                  at Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
                  at Test.run ($TAPE/index.js:$LINE:$COL)
                  at TestRunner.run ($TAPE/index.js:$LINE:$COL)
                  at Timeout._onTimeout ($TAPE/index.js:$LINE:$COL)
                  at listOnTimeout (node:internal/timers:$LINE:$COL)
                  at process.processTimers (node:internal/timers:$LINE:$COL)
          ...

        1..1
        # tests 1
        # pass  0
        # fail  1
        `)
    assert.end()
  }
})

test('zerotap handles multiple asserts', (assert) => {
  const h = new TestRunner(collect(verify))

  h.add('test one', function _ (t) {
    t.ok(true)
    t.ok(true, 'message')
    t.ok(false, 'some message')
  }, false)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # test one
        ok 1 should be truthy
        ok 2 message
        not ok 3 some message
          ---
            operator: ok
            expected: "truthy value"
            actual:   false
            at:       Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
            stack:    |-
              Error: some message
                  at Test._assert ($TAPE/index.js:$LINE:$COL)
                  at Test.ok ($TAPE/index.js:$LINE:$COL)
                  at Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
                  at Test.run ($TAPE/index.js:$LINE:$COL)
                  at TestRunner.run ($TAPE/index.js:$LINE:$COL)
                  at Timeout._onTimeout ($TAPE/index.js:$LINE:$COL)
                  at listOnTimeout (node:internal/timers:$LINE:$COL)
                  at process.processTimers (node:internal/timers:$LINE:$COL)
          ...

        1..3
        # tests 3
        # pass  2
        # fail  1
        `)

    assert.end()
  }
})

test('zerotap with multiple blocks', (assert) => {
  const h = new TestRunner(collect(verify))

  h.add('test one', (t) => {
    t.ok(true, 'message one')
    t.ok(true, 'message one 2')
  }, false)

  h.add('test two', (t) => {
    t.ok(true, 'message two')
  }, false)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # test one
        ok 1 message one
        ok 2 message one 2
        # test two
        ok 3 message two

        1..3
        # tests 3
        # pass  3

        # ok
        `)
    assert.end()
  }
})

test('zerotap other methods', (assert) => {
  const h = new TestRunner(collect(verify))

  h.add('test one', (t) => {
    t.ok(true)
    t.equal(true, true)
    t.notEqual(true, false)
    t.deepEqual({ foo: true }, { foo: true })
    t.notDeepEqual({ foo: true }, { bar: true })
    t.ifError(null)
    t.comment('a comment')
  }, false)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # test one
        ok 1 should be truthy
        ok 2 should be equal
        ok 3 should not be equal
        ok 4 should be equivalent
        ok 5 should not be equivalent
        ok 6 null
        # a comment

        1..6
        # tests 6
        # pass  6

        # ok
        `)
    assert.end()
  }
})

test('zerotap undefined is string', (assert) => {
  const h = new TestRunner(collect(verify))

  h.add('test one', (t) => {
    t.equal(undefined, 'foo')
  }, false)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # test one
        not ok 1 should be equal
          ---
            operator: equal
            expected: "foo"
            actual:   undefined
            at:       Test.fn ($TEST/unit/smoke.js:$LINE:$COL)
            stack:    |-
              Error: should be equal
                  at Test._assert ($TAPE/index.js:$LINE:$COL)
                  at Test.equal ($TAPE/index.js:$LINE:$COL)
                  at Test.fn ($TEST/unit/smoke.js:$LINE:$COL)
                  at Test.run ($TAPE/index.js:$LINE:$COL)
                  at TestRunner.run ($TAPE/index.js:$LINE:$COL)
                  at Timeout._onTimeout ($TAPE/index.js:$LINE:$COL)
                  at listOnTimeout (node:internal/timers:$LINE:$COL)
                  at process.processTimers (node:internal/timers:$LINE:$COL)
          ...

        1..1
        # tests 1
        # pass  0
        # fail  1
        `)
    assert.end()
  }
})

test('zerotap fail', (assert) => {
  const h = new TestRunner(collect(verify))

  h.add('test one', function _ (t) {
    t.fail('my message')
  }, false)

  /**
   * @param {string} actual
   * @returns {void}
   */
  function verify (actual) {
    assert.equal(actual, trimPrefix`
        TAP version 13
        # test one
        not ok 1 my message
          ---
            operator: fail
            expected: "fail not called"
            actual:   "fail called"
            at:       Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
            stack:    |-
              Error: my message
                  at Test._assert ($TAPE/index.js:$LINE:$COL)
                  at Test.fail ($TAPE/index.js:$LINE:$COL)
                  at Test._ [as fn] ($TEST/unit/smoke.js:$LINE:$COL)
                  at Test.run ($TAPE/index.js:$LINE:$COL)
                  at TestRunner.run ($TAPE/index.js:$LINE:$COL)
                  at Timeout._onTimeout ($TAPE/index.js:$LINE:$COL)
                  at listOnTimeout (node:internal/timers:$LINE:$COL)
                  at process.processTimers (node:internal/timers:$LINE:$COL)
          ...

        1..1
        # tests 1
        # pass  0
        # fail  1
        `)
    assert.end()
  }
})
