# textlint-rule-prh [![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/) [![Build Status](https://travis-ci.org/azu/textlint-rule-prh.svg?branch=master)](https://travis-ci.org/azu/textlint-rule-prh)

[![Greenkeeper badge](https://badges.greenkeeper.io/azu/textlint-rule-prh.svg)](https://greenkeeper.io/)

[textlint](https://github.com/azu/textlint "textlint") rule for [prh/prh: proofreading helper](https://github.com/prh/prh "prh/prh: proofreading helper").

This rule check the spell by used with `prh.yml`.

## Installation

    npm install textlint-rule-prh

## Usage

1. It require Rule Options!

```json
{
    "rules": {
        "prh": {
            "rulePaths" :["path/to/prh.yml"]
        }
    }
}
```

`rulePaths` : path to YAML file.

### Fixable

[![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/) 

`textlint-rule-prh` support `--fix` feature of textlint.

```sh
textlint --fix README.md
```

## What is prh.yml?

Please See [prh/prh: proofreading helper](https://github.com/prh/prh "prh/prh: proofreading helper").

### prh format

`prh.yml` can define RegExp as a dictionary.

```yaml
# prh version
version: 1
rules:

  # format case-sensitive
  - expected: Cookie
  # the above is equal to following
  # - expected: Cookie
  #   pattern: "/[CcＣｃ][OoＯｏ][OoＯｏ][KkＫｋ][IiＩｉ][EeＥｅ]/g"
  #   options:
  #     wordBoundary: false
  #   specs: []

  # Write test to `expect`
  - expected: jQuery
    specs:
      - from: jquery
        to:   jQuery
      - from: ＪＱＵＥＲＹ
        to:   jQuery

# If the `specs` is failed、fail to load prh.yml
# - expected: JavaScript
#   specs:
#     - from: JAVASCRIPT
#       to:   JavaScprit
# Error: JavaScript spec failed. "JAVASCRIPT", expected "JavaScprit", but got "JavaScript", /[JjＪｊ][AaＡａ][VvＶｖ][AaＡａ][SsＳｓ][CcＣｃ][RrＲｒ][IiＩｉ][PpＰｐ][TtＴｔ]/g

# pattern => expected
  - expected: default
    pattern:  deflaut

# Allow to write multiple `pattern`
  - expected: hardware
    patterns:
      - hadware
      - harrdware
      - harddware

# Allow to write `pattern` as RegExp
# Can use $1...$9
# Should wrap `/` and `/`
  # ECMAScript
  - expected: ECMAScript $1
    patterns:
      - /ECMAScript([0-9]+)/
      - /ECMA Script([0-9]+)/
    specs:
      - from: ECMAScript2015
        to:   ECMAScript 2015

# expected contain pattern
# https://github.com/azu/textlint-rule-prh/pull/8
  - expected: ベンダー
    pattern: /ベンダ(?!ー)/
    specs:
      - from: ベンダ
        to: ベンダー
      - from: ベンダー
        to: ベンダー
  # wordBoundary option
  - expected: js
  # === pattern: "/\b[JjＪｊ][SsＳｓ]\b/g"
    options:
      wordBoundary: true
    specs:
      - from: foo JS bar
        to:   foo js bar
      - from: foo altJS bar
        to:   foo altJS bar
```

#### imports

prh.yml can import other yaml file

```yaml
version: 1

imports:
  - imports-a.yml
  - imports-b.yml
  ```

## Example

See [azu/prh-textlint-example: Example of textlint + prh.](https://github.com/azu/prh-textlint-example "azu/prh-textlint-example: Example of textlint + prh.").


## Tests

    npm test

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT