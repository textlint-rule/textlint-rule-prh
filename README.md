# textlint-rule-prh [![textlint rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/) [![Build Status](https://travis-ci.org/azu/textlint-rule-prh.svg?branch=master)](https://travis-ci.org/azu/textlint-rule-prh)

[textlint](https://github.com/azu/textlint "textlint") rule for [vvakame/prh](https://github.com/vvakame/prh "vvakame/prh").

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

### What is prh.yml?

Please See [vvakame/prh](https://github.com/vvakame/prh "vvakame/prh").

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