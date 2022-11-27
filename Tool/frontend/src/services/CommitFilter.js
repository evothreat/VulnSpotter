
class CommitFilter {

    constructor(commits) {
        this.rest = [...commits];
        this.filtered = [];
        this.keywords = [];
        this.logicalOp = 'or';
    }

    filter(kw, op) {
        // logical operator is not same
        if (this.logicalOp !== op) {
            this.reset();
        }
        // case-insensitive search
        const kwRegex = new RegExp(kw, 'i');
        const matchFunc = (str) => kwRegex.test(str);

        if (this.logicalOp === 'or') {
            this.filterWithOr(matchFunc);
        }
        else if (this.logicalOp === 'and') {
            // if first time -> filter by this single keyword
            // move this check to filterWithAnd?
            if (this.keywords.length === 0) {
                this.filterWithOr(matchFunc);
            } else {
                this.filterWithAnd(matchFunc);
            }
        }
        this.logicalOp = op;
        this.keywords.push(kw);
    }

    changeOp(op) {
        if (op !== this.logicalOp) {
            this.rest.push(...this.filtered);

            if (this.keywords.length > 0) {
                if (op === 'or') {
                    const kwsRegex = new RegExp(this.keywords.join('|'), 'i');
                    this.filterWithOr((str) => kwsRegex.test(str));
                }
                else if (op === 'and') {
                    const kwsRegexes = this.keywords.map((v) => new RegExp(v, 'i'));
                    this.filterWithAnd((str) => {
                        for (const regex of kwsRegexes) {
                            if (!regex.test(str)) return false;
                        }
                        return true;
                    });
                }
            }
            this.logicalOp = op;
        }
    }

    // NOTE: the following methods are private & should not be called from outside
    filterWithOr(matchFunc) {
        for (let i = this.rest.length - 1; i >= 0; i--) {
            const c = this.rest[i];
            if (matchFunc(c.message)) {
                if (i === this.rest.length - 1) {
                    this.filtered(this.rest.pop());
                } else {
                    this.rest[i] = this.rest.pop();     // remove last & replace current with it with the last one (O(1))
                    this.filtered.push(c);
                }
            }
        }
    }

    filterWithAnd(matchFunc) {
        for (let i = this.filtered.length - 1; i >= 0; i--) {
            const c = this.filtered[i];
            if (!matchFunc(c.message)) {
                if (i === this.filtered.length - 1) {
                    this.rest.push(this.filtered.pop());
                } else {
                    this.filtered[i] = this.filtered.pop();  // NOTE: we need to preserve positions!
                    this.rest.push(c);
                }
            }
        }
    }

    reset() {
        this.rest.push(...this.filtered);
        this.keywords = [];
        this.logicalOp = '';
    }
}

export default CommitFilter;