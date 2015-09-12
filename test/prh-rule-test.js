// LICENSE : MIT
"use strict";
import assert from "power-assert";
import {textlint} from "textlint";
import rule from "../src/prh-rule";
describe("prh-rule-test", function () {
    beforeEach(function () {
        textlint.setupRules({
            "prh": rule
        }, {
            "prh": {
                "configPaths": [__dirname + "/fixtures/rule.yaml"]
            }
        });
    });
    afterEach(function () {
        textlint.resetRules();
    });
    it("should return json", function () {
        var result = textlint.lintMarkdown("テストjquery");
        assert(result.messages.length > 0);
        assert(result.messages[0].line === 1);
        assert(result.messages[0].column === 3);
    });
});
