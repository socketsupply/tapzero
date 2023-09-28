const test = require('../../../index').test

test('Execute fewer tests than planned', t => {
    t.plan(3)
    t.ok('example')
    t.ok('example 2')
})
