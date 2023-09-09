function ArrayIterator(array, startIx = 0) {
    this.array = array;
    this.currIx = startIx;
}

ArrayIterator.prototype.prev = function () {
    return this.currIx - 1 >= 0 ? this.array[--this.currIx] : undefined;
};

ArrayIterator.prototype.next = function () {
    return this.array.length > this.currIx + 1 ? this.array[++this.currIx] : undefined;
};

ArrayIterator.prototype.hasNext = function () {
    return !!this.array[this.currIx + 1];       // !! isn't necessary
};

ArrayIterator.prototype.curr = function () {
    return this.array[this.currIx];
};

ArrayIterator.prototype.begin = function () {
    this.currIx = 0;
    return this.array[0];
};

ArrayIterator.prototype.size = function () {
    return this.array.length;
};

ArrayIterator.prototype.seek = function (ix) {
    if (ix >= 0) {
        this.currIx = Math.min(this.array.length - 1, ix);
    } else if (ix < 0) {
        this.currIx = Math.max(0, this.array.length + ix);
    }
};

ArrayIterator.prototype.clone = function () {
    return new ArrayIterator(this.array, this.currIx);
};
export default ArrayIterator;