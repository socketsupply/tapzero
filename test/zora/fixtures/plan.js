const test = require('../../../index').test

test('Plan the correct number of tests', t => {
    t.plan(2)
    t.ok('example')
    t.ok('example')
})

test('.plan with an async function', async t => {
    t.plan(2)
    await sleep(10)
    t.ok('hello')
    await sleep(20)
    t.ok('hello')
})

/**
 * Wait for a number of miliseconds.
 * @param {number} ms 
 */
async function sleep (ms) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
