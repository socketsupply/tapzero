const test = require('../../../index').test

test('Plan an incorrect number of tests', t => {
    t.plan(1)
    t.ok('example')
    t.ok('example')
})
