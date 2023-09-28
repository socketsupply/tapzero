const test = require('../../../index').test

test('Plan the correct number of tests', t => {
    t.plan(2)
    t.ok('example')
    t.ok('example')
})
