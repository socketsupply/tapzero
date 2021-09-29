'use strict'

const http = require('http')
const util = require('util')

const tapzero = require('../../index.js')
const tapeHarness = require('../../harness.js')

class AsyncHarness {
  /**
   * @param {{ port?: number }} opts
   */
  constructor (opts) {
    /** @type {number} */
    this.port = opts.port || 0
    /** @type {import('http').Server} */
    this.server = http.createServer()

    this.server.on('request', (
      /** @type {import('http').IncomingMessage} */ req,
      /** @type {import('http').ServerResponse} */ res
    ) => {
      res.end(req.url)
    })
  }

  async bootstrap () {
    await util.promisify((cb) => {
      this.server.listen(this.port, () => {
        const addr = this.server.address()
        if (addr && typeof addr === 'object') {
          this.port = addr.port
        }
        cb(null, null)
      })
    })()
  }

  async close () {
    await util.promisify((cb) => {
      this.server.close(() => {
        cb(null, null)
      })
    })()
  }
}
AsyncHarness.test = tapeHarness(tapzero, AsyncHarness)

module.exports = AsyncHarness
