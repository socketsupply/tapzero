const test = require('../../../index').test

test('will not go to the end', function _(t) {
    t.ok(true, 'okay');

    throw new Error('Oh no!');

    t.fail('should never be reached')
});

test('another one', t => {
    t.fail('should never be reported');
});
