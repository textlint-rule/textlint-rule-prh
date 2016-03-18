// LICENSE : MIT
"use strict";
var TextLintTester = require("textlint-tester");
var tester = new TextLintTester();
// rule
import rule from "../src/prh-rule";
// ruleName, rule, { valid, invalid }
tester.run("prh", rule, {
    valid: [
        {
            text: "JavaScript library",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        }
    ],
    invalid: [
        {
            text: "cookie is a data.\n" +
            "texlint check your texts.\n" +
            "jquery is libray.\n",
            output: "Cookie is a data.\n" +
            "texlint check your texts.\n" +
            "jQuery is libray.\n",
            options: {
                "rulePaths": [__dirname + "/fixtures/rule.yaml"]
            },
            errors: [
                {
                    message: "cookie => Cookie",
                    line: 1,
                    column: 1
                },
                {
                    message: "jquery => jQuery",
                    line: 3,
                    column: 1
                }
            ]
        }
    ]
});