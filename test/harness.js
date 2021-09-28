'use strict'

/**
 * @typedef {import('@pre-bundled/tape').Test} Test
 * @typedef {import('@pre-bundled/tape')} tape
 * @typedef {import('@pre-bundled/tape').TestCase} TestCase
 */

const util = require('util')
const request = require('request')

const tapzero = require('../index.js')
const testHarness = require('../harness.js')

const AsyncHarness = require('./lib/async-harness.js')
const MyTestHarness = require('./lib/test-harness.js')

const promiseRequest = util.promisify(request)

MyTestHarness.test('a test', {
  port: 8301
}, async function t (harness, assert) {
  return new Promise((resolve) => {
    request({
      url: 'http://localhost:' + harness.port + '/foo'
    }, function onResponse (err, resp) {
      assert.ifError(err)

      assert.equal(resp.statusCode, 200)
      assert.equal(resp.body, '/foo')

      resolve()
    })
  })
})

MyTestHarness.test('no options', async function t (harness, assert) {
  return new Promise((resolve) => {
    request({
      url: 'http://localhost:' + harness.port + '/foo'
    }, function onResponse (err, resp) {
      assert.ifError(err)

      assert.equal(resp.statusCode, 200)
      assert.equal(resp.body, '/foo')

      resolve()
    })
  })
})

MyTestHarness.test('async await', async function t (harness, assert) {
  const resp = await promiseRequest({
    url: 'http://localhost:' + harness.port + '/foo'
  })

  assert.equal(resp.statusCode, 200)
  assert.equal(resp.body, '/foo')
})

MyTestHarness.test('async await no end',
  async function t (harness, assert) {
    const resp = await promiseRequest({
      url: 'http://localhost:' + harness.port + '/foo'
    })

    assert.equal(resp.statusCode, 200)
    assert.equal(resp.body, '/foo')
  })

MyTestHarness.test('no function name')

AsyncHarness.test(
  'async await promise',
  async function t (harness, assert) {
    const resp = await promiseRequest({
      url: 'http://localhost:' + harness.port + '/foo'
    })

    assert.equal(resp.statusCode, 200)
    assert.equal(resp.body, '/foo')
  }
)

AsyncHarness.test(
  'async await promise without end',
  async function t (harness, assert) {
    const resp = await promiseRequest({
      url: 'http://localhost:' + harness.port + '/foo'
    })

    assert.equal(resp.statusCode, 200)
    assert.equal(resp.body, '/foo')
  }
)

tapzero.skip('handles bootstrap error', function t (assert) {
  class TestClass {
    /** @param {(e?: Error) => void} cb */
    bootstrap (cb) {
      cb(new Error('it failed'))
    }

    /** @param {(e?: Error) => void} cb */
    close (cb) {
      cb()
    }
  }

  const myTest = testHarness(
    (/** @type {any} */ ({ test: tapeLike })),
    TestClass
  )

  myTest('a name', (_, _assertLike) => {
    assert.fail('should not reach here')
    // assert.end()
  })

  /**
   * @param {string} name
   * @param {Function} fn
   */
  function tapeLike (name, fn) {
    let hasError = false
    assert.equal(name, 'a name')
    fn({
      end: function end () {
        assert.ok(hasError)

        // assert.end()
      },
      ifError: (/** @type {Error} */ err) => {
        hasError = true
        assert.ok(err)
        assert.equal(err.message, 'it failed')
      }
    })
  }
})

tapzero.skip('handles async bootstrap error', function t (assert) {
  class TestClass {
    async bootstrap () {
      throw new Error('it failed')
    }

    /** @param {(e?: Error) => void} cb */
    close (cb) {
      cb()
    }
  }

  const myTest = testHarness(
    (/** @type {any} */ ({ test: tapeLike })),
    TestClass
  )

  myTest('a name', (_, _assertLike) => {
    assert.fail('should not reach here')
    // assertLike.end()
  })

  /**
   * @param {string} name
   * @param {Function} fn
   */
  function tapeLike (name, fn) {
    let hasError = false
    assert.equal(name, 'a name')
    fn({
      end: function end () {
        assert.ok(hasError)

        // assert.end()
      },
      ifError: (/** @type {Error} */ err) => {
        hasError = true
        assert.ok(err)
        assert.equal(err.message, 'it failed')
      }
    })
  }
})

tapzero.skip('handles close error', function t (assert) {
  class TestClass {
    /** @param {(e?: Error) => void} cb */
    bootstrap (cb) {
      cb()
    }

    /** @param {(e?: Error) => void} cb */
    close (cb) {
      cb(new Error('it failed'))
    }
  }

  const myTest = testHarness(
    (/** @type {any} */ ({ test: tapeLike })),
    TestClass
  )

  myTest('a name', function _ (harness, _assertLike) {
    assert.ok(harness)
    // assertLike.end()
  })

  /**
   * @param {string} name
   * @param {Function} fn
   */
  function tapeLike (name, fn) {
    let hasError = false
    assert.equal(name, 'a name')
    fn({
      end: function end () {
        assert.ok(hasError)

        // assert.end()
      },
      ifError: (/** @type {Error} */ err) => {
        hasError = true
        assert.ok(err)
        assert.equal(err.message, 'it failed')
      }
    })
  }
})

tapzero.skip('handles async close error', function t (assert) {
  class TestClass {
    /** @param {(e?: Error) => void} cb */
    bootstrap (cb) {
      cb()
    }

    async close () {
      throw new Error('it failed')
    }
  }

  const myTest = testHarness(
    (/** @type {any} */ ({ test: tapeLike })),
    TestClass
  )

  myTest('a name', function _ (harness, _assertLike) {
    assert.ok(harness)
    // assertLike.end()
  })

  /**
   * @param {string} name
   * @param {Function} fn
   */
  function tapeLike (name, fn) {
    let hasError = false
    assert.equal(name, 'a name')
    fn({
      end: function end () {
        assert.ok(hasError)

        // assert.end()
      },
      ifError: (/** @type {Error} */ err) => {
        hasError = true
        assert.ok(err)
        assert.equal(err.message, 'it failed')
      }
    })
  }
})

tapzero.skip('handles thrown exception', function t (assert) {
  class TestClass {
    async bootstrap () {}
    async close () {}
  }

  const myTest = testHarness(
    (/** @type {any} */ ({ test: tapeLike })),
    TestClass
  )

  process.once('uncaughtException', (err) => {
    assert.equal(err.message, 'it failed')
    // assert.end()
  })

  myTest('a name', async (_harness, _assert) => {
    throw new Error('it failed')
  })

  /**
   * @param {string} name
   * @param {Function} fn
   */
  function tapeLike (name, fn) {
    assert.equal(name, 'a name')
    fn({
      end: function end () {
        assert.ok(false, 'should never be called')
      },
      ifError: function ifError () {
        assert.ok(false, 'should never be called')
      }
    })
  }
})

tapzero.skip('handles thrown exception but also double end',
  function t (assert) {
    class TestClass {
      async bootstrap () {}
      async close () {}
    }

    let onlyOnce = false
    const myTest = testHarness(
      (/** @type {any} */ ({ test: tapeLike })),
      TestClass
    )

    process.once('uncaughtException', (err) => {
      assert.equal(err.message, 'it failed')
      assert.equal(onlyOnce, true)
      // assert.end()
    })

    myTest('a name', async (_harness, _assertLike) => {
      // assertLike.end()
      throw new Error('it failed')
    })

    /**
     * @param {string} name
     * @param {Function} fn
     */
    function tapeLike (name, fn) {
      assert.equal(name, 'a name')
      fn({
        end: function end () {
          if (onlyOnce) {
            assert.ok(false, 'double end')
          }
          onlyOnce = true
        },
        ifError: function ifError () {
          assert.ok(false, 'should not be called')
        }
      })
    }
  })
