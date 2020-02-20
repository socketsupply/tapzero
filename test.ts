'use strict'

import * as test from 'tape'
import * as tapzero from './index.ts'

test("tassert outputs TAP", function (assert) {
    var a = tassert("test one")
    a.stream.pipe(toArray(function (list) {
        var first = list.slice(0, 15)
        var last = list.slice(-6)

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
    }))

    a(true)
    a(true, "message")
    a(false, "some message")

    a.end()
})
