// LICENSE : MIT
"use strict";
import assert from "power-assert";
import {textlint} from "textlint";
import rule from "../src/prh-rule";
import path from "path";
describe(".textlinrc test", function () {
    context("when use .textlintrc", function () {
        it("should resolve path to rule.yaml", function () {
            textlint.setupRules({
                "prh": rule
            }, {
                "prh": {
                    "rulePaths": ["./rule.yaml"]
                }
            }, {
                "configFile": path.join(__dirname, "fixtures", ".textlintrc")
            });
            var result = textlint.lintMarkdown("jquery");
            assert(result.messages.length === 1);
            assert(result.messages[0].line === 1);
            assert(result.messages[0].column === 1);
            textlint.resetRules();
        });
        it("should resolve path to rule.yaml", function () {
            textlint.setupRules({
                "prh": rule
            }, {
                "prh": {
                    "rulePaths": [path.join(__dirname, "fixtures", "rule.yaml")]
                }
            }, {
                "configFile": path.join(__dirname, "fixtures", ".textlintrc")
            });
            var result = textlint.lintMarkdown("jquery");
            assert(result.messages.length === 1);
            assert(result.messages[0].line === 1);
            assert(result.messages[0].column === 1);
            textlint.resetRules();
        });
    });
});
