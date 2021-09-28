// @ts-check
'use strict'

const http = require('http')

const tapzero = require('../../index.js')
const tapeHarness = require('../../harness.js')

class MyTestHarness {
  /**
   * @param {{ port?: number }} opts
   */
  constructor (opts) {
    this.port = opts.port || 0
    this.server = http.createServer()

    this.server.on('request', (req, res) => {
      res.end(req.url)
    })
  }

  /**
   * @param {() => void} cb
   */
  bootstrap (cb) {
    this.server.once('listening', () => {
      const addr = this.server.address()
      if (addr && typeof addr === 'object') {
        this.port = addr.port
      }
      cb()
    })
    this.server.listen(this.port)
  }

  /**
   * @param {() => void} cb
   */
  close (cb) {
    this.server.close(cb)
  }
}

MyTestHarness.test = tapeHarness(tapzero, MyTestHarness)

module.exports = MyTestHarness
