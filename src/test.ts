'use strict'

import * as test from '@pre-bundled/tape'
import { Harness } from './index'

// test('test one', (t) => {
//     t.ok(true)
//     t.ok(true, 'message')
//     t.ifError(new Error('foo'))
//     t.equal(false, 'some message')
//     t.end()
// })

test('tassert outputs TAP', (assert) => {
    const h = new Harness(collect((list) => {
        console.log('output', list.join('\n'))

        const expected = trimPrefix`
            TAP version 13
            # test one
            ok 1 should be truthy
            ok 2 message
            not ok 3 some message
            ---
                operator: ok
                expected: "truthy value"
                actual:   false
                stack:    |-
                Error: some message
                    at Test._assert (/home/raynos/projects/tapzero/build/src/index.js:105:23)
                    at Test.ok (/home/raynos/projects/tapzero/build/src/index.js:74:14)
                    at Test.fn (/home/raynos/projects/tapzero/build/src/test.js:51:11)
                    at Test.run (/home/raynos/projects/tapzero/build/src/index.js:141:29)
                    at Harness.run (/home/raynos/projects/tapzero/build/src/index.js:211:39)
                    at Timeout._onTimeout (/home/raynos/projects/tapzero/build/src/index.js:195:22)
                    at listOnTimeout (internal/timers.js:531:17)
                    at processTimers (internal/timers.js:475:7)
            ...

            1..3
            # tests 3
            # pass  2
            # fail  1
        `
        assert.equal()

        // assert.deepEqual(first, [
        //     "TAP version 13"
        //     , "# test one"
        //     , "ok 1"
        //     , "ok 2 message"
        //     , "not ok 3 some message"
        //     , "  ---"
        //     , "    operator: error"
        //     , "    expected:"
        //     , "      "
        //     , "    actual:"
        //     , "      {"
        //     , "        \"name\": \"AssertionError\","
        //     , "        \"message\": \"some message\","
        //     , "        \"actual\": false,"
        //     , "        \"expected\": true,"
        // ])

        // assert.deepEqual(last, [
        //     "  ..."
        //     , ""
        //     , "1..3"
        //     , "# tests 3"
        //     , "# pass  2"
        //     , "# fail  1"
        // ])

        assert.end()
    }))

    h.add('test one', (t) => {
        t.ok(true)
        t.ok(true, "message")
        t.ok(false, "some message")
    }, false)
})

function collect (fn) {
    const total = []

    return function report(lines) {
        for (const line of lines) {
            const moreLines = line.split('\n')
            total.push(...moreLines)
        }
        if (lines[0] && lines[0].startsWith('\n1..')) {
            fn(total)
        }
    }
}

function trimPrefix (text) {
    const lines = text[0].split('\n')
    let commonPrefix = Infinity
    for (const line of lines) {
        if (line === '') continue
        const prefix = line.search(/\S|$/)
        if (prefix < commonPrefix) {
            commonPrefix = prefix
        }
    }

    let result = []
    for (const line of lines) {
        result.push(line.slice(commonPrefix))
    }

    return result.join('\n').trim()
}
