'use strict'

import * as test from '@pre-bundled/tape'
import { Harness } from './index'

const TAP_HEADER = "TAP version 13"

test("tassert outputs TAP", function (assert) {
    const h = new Harness(function (list) {
        const first = list.slice(0, 15)
        const last = list.slice(-6)

        assert.deepEqual(first, [
            TAP_HEADER
            , "# test one"
            , "ok 1"
            , "ok 2 message"
            , "not ok 3 some message"
            , "  ---"
            , "    operator: error"
            , "    expected:"
            , "      "
            , "    actual:"
            , "      {"
            , "        \"name\": \"AssertionError\","
            , "        \"message\": \"some message\","
            , "        \"actual\": false,"
            , "        \"expected\": true,"
        ])

        assert.deepEqual(last, [
            "  ..."
            , ""
            , "1..3"
            , "# tests 3"
            , "# pass  2"
            , "# fail  1"
        ])

        assert.end()
    })

    h.add('test one', (t) => {
        t.ok(true)
        t.ok(true, "message")
        t.ok(false, "some message")
    }, false)
})
