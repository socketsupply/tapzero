// @ts-check
'use strict'

const BenchMark = require('tiny-benchy')
const MAX_ITERATIONS = 5000
const bench = new BenchMark(MAX_ITERATIONS)

const { performance } = require('perf_hooks')

const startDate = Date.now()
const startPerf = performance.now()
const startHr = process.hrtime()
const startBigInt = process.hrtime.bigint()

const knownDeltas = []

bench.add('Date.now()', () => {
  const curr = Date.now()

  knownDeltas[0] = curr - startDate
})

bench.add('Performance.now()', () => {
  const curr = performance.now()

  knownDeltas[0] = curr - startPerf
})

bench.add('process.hrtime(start)', () => {
  knownDeltas[0] = process.hrtime(startHr)
})

bench.add('process.hrtime().bigint()', () => {
  const curr = process.hrtime.bigint()

  knownDeltas[0] = curr - startBigInt
})

bench.run()
