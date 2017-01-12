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
        },
        {
            text: "行う、行なう、おこなう。行って、行わない、行ないます。",
            output: "おこなう、おこなう、おこなう。おこなって、おこなわない、おこないます。",
            options: {
                "rulePaths": [__dirname + "/fixtures/prefer-regexp.yml"]
            },
            errors: [
                {
                    "type": "lint",
                    "ruleId": "prh",
                    "message": "行 => おこな",
                    "index": 0,
                    "line": 1,
                    "column": 1,
                    "severity": 2,
                    "fix": {
                        "range": [
                            0,
                            1
                        ],
                        "text": "おこな"
                    }
                },
                {
                    "type": "lint",
                    "ruleId": "prh",
                    "message": "行な => おこな",
                    "index": 3,
                    "line": 1,
                    "column": 4,
                    "severity": 2,
                    "fix": {
                        "range": [
                            3,
                            5
                        ],
                        "text": "おこな"
                    }
                },
                {
                    "type": "lint",
                    "ruleId": "prh",
                    "message": "行 => おこな",
                    "index": 12,
                    "line": 1,
                    "column": 13,
                    "severity": 2,
                    "fix": {
                        "range": [
                            12,
                            13
                        ],
                        "text": "おこな"
                    }
                },
                {
                    "type": "lint",
                    "ruleId": "prh",
                    "message": "行 => おこな",
                    "index": 16,
                    "line": 1,
                    "column": 17,
                    "severity": 2,
                    "fix": {
                        "range": [
                            16,
                            17
                        ],
                        "text": "おこな"
                    }
                },
                {
                    "type": "lint",
                    "ruleId": "prh",
                    "message": "行な => おこな",
                    "index": 21,
                    "line": 1,
                    "column": 22,
                    "severity": 2,
                    "fix": {
                        "range": [
                            21,
                            23
                        ],
                        "text": "おこな"
                    }
                }
            ]
        }
    ]
});