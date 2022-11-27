import {arrayDiff} from "../utils";


function matchOr(kws) {
    const kwsRegex = new RegExp(kws.join('|'), 'i');
    return (str) => kwsRegex.test(str);
}

function matchAnd(kws) {
    const kwsRegexes = kws.map((kw) => new RegExp(kw, 'i'));
    return (str) => {
        for (const regex of kwsRegexes) {
            if (!regex.test(str)) return false;
        }
        return true;
    };
}

class CommitFilter {

    constructor(commits = [], result = [], keywords = [], logicalOp = 'or') {
        this.rest = commits;
        this.result = result;
        this.keywords = keywords;
        this.logicalOp = logicalOp;
    }

    updateKeywords(kws) {
        if (kws.length === 0) {
            this.reset()
            return;
        }

        const removedKws = arrayDiff(this.keywords, kws);
        const addedKws = arrayDiff(kws, this.keywords);

        if (this.logicalOp === 'or') {
            if (removedKws.length > 0) {
                this.filterInResult(matchOr(kws));
            }
            if (addedKws.length > 0) {
                this.filterInRest(matchOr(addedKws));
            }
        } else if (this.logicalOp === 'and') {
            const matcher = matchAnd(kws);

            if (removedKws.length > 0) {
                this.filterInRest(matcher);
            }
            if (addedKws.length > 0) {
                if (this.keywords.length > 0) {
                    this.filterInResult(matcher);
                }
                else {
                    this.filterInRest(matcher);
                }
            }
        }
        this.keywords = kws;
    }

    changeLogicalOp(op) {
        if (op !== this.logicalOp) {
            this.rest.push(...this.result);
            this.result = [];

            if (this.keywords.length > 0) {
                if (op === 'or') {
                    this.filterInRest(matchOr(this.keywords));
                } else if (op === 'and') {
                    this.filterInRest(matchAnd(this.keywords));
                }
            }
            this.logicalOp = op;
        }
    }

    // NOTE: the following methods are private & should not be called from outside
    filterInRest(matchFunc) {
        for (let i = this.rest.length - 1; i >= 0; i--) {
            const c = this.rest[i];
            if (matchFunc(c.message)) {
                if (i === this.rest.length - 1) {
                    this.result.push(this.rest.pop());
                } else {
                    this.rest[i] = this.rest.pop();
                    this.result.push(c);
                }
            }
        }
    }

    filterInResult(matchFunc) {
        for (let i = this.result.length - 1; i >= 0; i--) {
            const c = this.result[i];
            if (!matchFunc(c.message)) {
                if (i === this.result.length - 1) {
                    this.rest.push(this.result.pop());
                } else {
                    this.result[i] = this.result.pop();  // NOTE: do we need to preserve positions?
                    this.rest.push(c);
                }
            }
        }
    }

    reset() {
        // NOTE: do this to preserve element positions
        this.result.push(...this.rest);
        this.rest = this.result;
        this.result = [];
        this.keywords = [];
        //this.logicalOp = 'or';    // do not reset, cause it's user-defined value
    }

    clone() {
        return new CommitFilter(this.rest, this.result, this.keywords, this.logicalOp);
    }

    getEndResult() {
        return this.keywords.length > 0 ? this.result : this.rest;
    }
}

export default CommitFilter;