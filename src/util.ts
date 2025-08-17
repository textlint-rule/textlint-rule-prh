import { fromYAML } from "prh";

export const defaultOptions = {
    checkLink: false,
    checkBlockQuote: false,
    checkEmphasis: false,
    checkHeader: true,
    checkParagraph: true,
    /**
     * Check CodeBlock text
     * Default: []
     */
    checkCodeComment: [],
    /**
     * Report parsing error for debug
     */
    debug: false
};

export function mergePrh(...engines) {
    const engines_ = engines.filter((engine) => !!engine);
    const mainEngine = engines_[0];
    engines_.slice(1).forEach((engine) => {
        mainEngine.merge(engine);
    });
    return mainEngine;
}

export const assertOptions = (options) => {
    if (typeof options.ruleContents === "undefined" && typeof options.rulePaths === "undefined") {
        throw new Error(`textlint-rule-prh require Rule Options.
Please set .textlintrc:
{
    "rules": {
        "prh": {
            "rulePaths" :["path/to/prh.yml"]
        }
    }
}
`);
    }
};

export const createIgnoreNodeTypes = (options, Syntax) => {
    const nodeTypes = [];
    if (!options.checkLink) {
        nodeTypes.push(Syntax.Link);
    }
    if (!options.checkBlockQuote) {
        nodeTypes.push(Syntax.BlockQuote);
    }
    if (!options.checkEmphasis) {
        nodeTypes.push(Syntax.Emphasis);
    }
    if (!options.checkHeader) {
        nodeTypes.push(Syntax.Header);
    }
    if (!options.checkParagraph) {
        nodeTypes.push(Syntax.Paragraph);
    }
    return nodeTypes;
};

/**
 * for each diff of changeSet
 * @param {ChangeSet} changeSet
 * @param {string} str
 * @param {function({
 * matchStartIndex: number,
 * matchEndIndex: number,
 * actual: string
 * expected: string
 * })} onChangeOfMatch
 */
export const forEachChange = (changeSet, str, onChangeOfMatch) => {
    const sortedDiffs = changeSet.diffs.sort(function (a, b) {
        return a.index - b.index;
    });
    let delta = 0;
    sortedDiffs.forEach(function (diff) {
        const result = diff.expected.replace(/\$([0-9]{1,2})/g, function (match, g1) {
            const index = parseInt(g1);
            if (index === 0 || diff.matches.length - 1 < index) {
                return match;
            }
            return diff.matches[index] || "";
        });
        // matchStartIndex/matchEndIndex value is original position, not replaced position
        // textlint use original position
        const matchStartIndex = diff.index;
        const matchEndIndex = matchStartIndex + diff.matches[0].length;
        // actual => expected
        const actual = str.slice(diff.index + delta, diff.index + delta + diff.matches[0].length);
        const prh = diff.rule.raw.prh || null;
        onChangeOfMatch({
            matchStartIndex,
            matchEndIndex,
            actual: actual,
            expected: result,
            prh
        });
        str = str.slice(0, diff.index + delta) + result + str.slice(diff.index + delta + diff.matches[0].length);
        delta += result.length - diff.matches[0].length;
    });
};

/**
 * [Markdown] get actual code value from CodeBlock node
 * @param {Object} node
 * @param {string} raw raw value include CodeBlock syntax
 * @returns {string}
 */
export function getUntrimmedCode(node, raw) {
    if (node.type !== "CodeBlock") {
        return node.value;
    }
    // Space indented CodeBlock that has not lang
    if (!node.lang) {
        return node.value;
    }

    // If it is not markdown codeBlock, just use node.value
    if (!(raw.startsWith("```") && raw.endsWith("```"))) {
        if (node.value.endsWith("\n")) {
            return node.value;
        }
        return node.value + "\n";
    }
    // Markdown(remark) specific hack
    // https://github.com/wooorm/remark/issues/207#issuecomment-244620590
    const lines = raw.split("\n");
    // code lines without the first line and the last line
    const codeLines = lines.slice(1, lines.length - 1);
    // add last new line
    // \n```
    return codeLines.join("\n") + "\n";
}

export function createPrhEngineFromContents(yamlContents) {
    if (yamlContents.length === 0) {
        return null;
    }
    const dummyFilePath = "";
    const prhEngine = fromYAML(dummyFilePath, yamlContents[0]);
    yamlContents.slice(1).forEach((content) => {
        const config = fromYAML(dummyFilePath, content);
        prhEngine.merge(config);
    });
    return prhEngine;
}
