'use strict'

/**
 * @typedef {import('./index').Test} Test
 * @typedef {(t: Test) => Promise<void> | void} TestCase
 * @typedef {{
 *    bootstrap(cb?: (e?: Error) => void): void | Promise<void>
 *    close(cb?: (e?: Error) => void): void | Promise<void>
 * }} Harness
 */

/**
 * @template {Harness} T
 * @typedef {{
      (
        name: string,
        cb?: (harness: T, test: Test) => (void | Promise<void>)
      ): void;
      (
        name: string,
        opts: object,
        cb: (harness: T, test: Test) => (void | Promise<void>)
      ): void;

      only(
        name: string,
        cb?: (harness: T, test: Test) => (void | Promise<void>)
      ): void;
      only(
        name: string,
        opts: object,
        cb: (harness: T, test: Test) => (void | Promise<void>)
      ): void;

      skip(
        name: string,
        cb?: (harness: T, test: Test) => (void | Promise<void>)
      ): void;
      skip(
        name: string,
        opts: object,
        cb: (harness: T, test: Test) => (void | Promise<void>)
      ): void;
 * }} TapeTestFn
 */

module.exports = wrapHarness

/**
 * @template {Harness} T
 * @param {import('./index.js')} tapzero
 * @param {new (options: object) => T} Harness
 * @returns {TapeTestFn<T>}
 */
function wrapHarness (tapzero, Harness) {
  const harness = new TapeHarness(tapzero, Harness)

  test.only = harness.only.bind(harness)
  test.skip = harness.skip.bind(harness)

  return test

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   */
  function test (testName, options, fn) {
    return harness.test(testName, options, fn)
  }
}

/**
 * @template {Harness} T
 */
class TapeHarness {
  /**
   * @param {import('./index.js')} tapzero
   * @param {new (options: object) => T} Harness
   */
  constructor (tapzero, Harness) {
    this.tapzero = tapzero
    this.Harness = Harness
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   */
  test (testName, options, fn) {
    this._test(this.tapzero.test, testName, options, fn)
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   */
  only (testName, options, fn) {
    this._test(this.tapzero.only, testName, options, fn)
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   */
  skip (testName, options, fn) {
    this._test(this.tapzero.skip, testName, options, fn)
  }

  /**
   * @param {(str: string, fn?: TestCase) => void} tapzeroFn
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   */
  _test (tapzeroFn, testName, options, fn) {
    if (!fn && typeof options === 'function') {
      fn = /** @type {(h: T, test: Test) => void} */ (options)
      options = {}
    }

    if (!fn) {
      return tapzeroFn(testName)
    }
    const testFn = fn

    tapzeroFn(testName, (assert) => {
      return new Promise((resolve) => {
        this._onAssert(assert, options || {}, testFn, resolve)
      })
    })
  }

  /**
   * @param {Test} assert
   * @param {object} options
   * @param {(harness: T, test: Test) => (void | Promise<void>)} fn
   * @param {() => void} cb
   */
  _onAssert (assert, options, fn, cb) {
    Reflect.set(options, 'assert', assert)
    const harness = new this.Harness(options)
    const ret = harness.bootstrap(onHarness)
    if (ret && ret.then) {
      ret.then(function success () {
        process.nextTick(onHarness)
      }, function fail (promiseError) {
        process.nextTick(onHarness, promiseError)
      })
    }

    /**
     * @param {Error} [err]
     */
    function onHarness (err) {
      if (err) {
        return assert.ifError(err)
      }

      const ret = fn(harness, assert)
      if (ret && ret.then) {
        ret.then(function onComplete () {
          asyncEnd()
        }, function fail (promiseError) {
          const ret = harness.close((err2) => {
            if (err2) {
              console.error('TestHarness.close() has an err', {
                error: err2
              })
            }

            process.nextTick(() => {
              throw promiseError
            })
          })
          if (ret && ret.then) {
            ret.then(() => {
              process.nextTick(() => {
                throw promiseError
              })
            }, (/** @type {Error} */ _failure) => {
              console.error('TestHarness.close() has an err', {
                error: _failure
              })

              process.nextTick(() => {
                throw promiseError
              })
            })
          }
        })
      } else {
        asyncEnd()
      }
    }

    /**
     * @param {Error} [err]
     */
    function asyncEnd (err) {
      if (err) {
        assert.ifError(err)
      }

      const ret = harness.close((err2) => {
        onEnd(err2)
      })
      if (ret && ret.then) {
        ret.then(() => {
          process.nextTick(onEnd)
        }, (/** @type {Error} */ promiseError) => {
          process.nextTick(onEnd, promiseError, err)
        })
      }
    }

    /**
     * @param {Error} [err2]
     */
    function onEnd (err2) {
      if (err2) {
        assert.ifError(err2)
      }

      cb()
    }
  }
}
