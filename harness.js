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
 *    (
 *      name: string,
 *      cb?: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 *    (
 *      name: string,
 *      opts: object,
 *      cb: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 *    only(
 *      name: string,
 *      cb?: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 *    only(
 *      name: string,
 *      opts: object,
 *      cb: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 *    skip(
 *      name: string,
 *      cb?: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 *    skip(
 *      name: string,
 *      opts: object,
 *      cb: (harness: T, test: Test) => (void | Promise<void>)
 *    ): void;
 * }} TapeTestFn
 */

module.exports = wrapHarness

/**
 * @template {Harness} T
 * @param {import('./index.js')} tapzero
 * @param {new (options: object) => T} harnessClass
 * @returns {TapeTestFn<T>}
 */
function wrapHarness (tapzero, harnessClass) {
  const harness = new TapeHarness(tapzero, harnessClass)

  test.only = harness.only.bind(harness)
  test.skip = harness.skip.bind(harness)

  return test

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   * @returns {void}
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
   * @param {new (options: object) => T} harnessClass
   */
  constructor (tapzero, harnessClass) {
    /** @type {import('./index.js')} */
    this.tapzero = tapzero
    /** @type {new (options: object) => T} */
    this.harnessClass = harnessClass
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   * @returns {void}
   */
  test (testName, options, fn) {
    this._test(this.tapzero.test, testName, options, fn)
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   * @returns {void}
   */
  only (testName, options, fn) {
    this._test(this.tapzero.only, testName, options, fn)
  }

  /**
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   * @returns {void}
   */
  skip (testName, options, fn) {
    this._test(this.tapzero.skip, testName, options, fn)
  }

  /**
   * @param {(str: string, fn?: TestCase) => void} tapzeroFn
   * @param {string} testName
   * @param {object} [options]
   * @param {(harness: T, test: Test) => (void | Promise<void>)} [fn]
   * @returns {void}
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
   * @returns {void}
   */
  _onAssert (assert, options, fn, cb) {
    Reflect.set(options, 'assert', assert)
    const Harness = this.harnessClass
    const harness = new Harness(options)
    const ret = harness.bootstrap(onHarness)
    if (ret && Reflect.get(ret, 'then')) {
      ret.then(function success () {
        setTimeout(onHarness, 0)
      }, function fail (promiseError) {
        setTimeout(onHarness, 0, promiseError)
      })
    }

    /**
     * @param {Error} [err]
     * @returns {void}
     */
    function onHarness (err) {
      if (err) {
        return assert.ifError(err)
      }

      const ret = fn(harness, assert)
      if (ret && Reflect.get(ret, 'then')) {
        ret.then(function onComplete () {
          asyncEnd()
        }, function fail (promiseError) {
          const ret = harness.close((err2) => {
            if (err2) {
              console.error('TestHarness.close() has an err', {
                error: err2
              })
            }

            setTimeout(() => {
              throw promiseError
            }, 0)
          })
          if (ret && Reflect.get(ret, 'then')) {
            ret.then(() => {
              setTimeout(() => {
                throw promiseError
              }, 0)
            }, (/** @type {Error} */ _failure) => {
              console.error('TestHarness.close() has an err', {
                error: _failure
              })

              setTimeout(() => {
                throw promiseError
              }, 0)
            })
          }
        })
      } else {
        asyncEnd()
      }
    }

    /**
     * @param {Error} [err]
     * @returns {void}
     */
    function asyncEnd (err) {
      if (err) {
        assert.ifError(err)
      }

      const ret = harness.close((err2) => {
        onEnd(err2)
      })
      if (ret && Reflect.get(ret, 'then')) {
        ret.then(() => {
          setTimeout(onEnd, 0)
        }, (/** @type {Error} */ promiseError) => {
          setTimeout(onEnd, 0, promiseError, err)
        })
      }
    }

    /**
     * @param {Error} [err2]
     * @returns {void}
     */
    function onEnd (err2) {
      if (err2) {
        assert.ifError(err2)
      }

      cb()
    }
  }
}
