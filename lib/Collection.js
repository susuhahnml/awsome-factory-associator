class Collection {
  constructor(initialValue, increment) {
    if (typeof initialValue === 'function') {
      initialValue = initialValue();
    }
    this.isStringIncrement = typeof initialValue === 'string';
    this.initialValue = initialValue;
    this.currentValue = this.isStringIncrement?1:initialValue;
    this.increment = increment;
  }

  getNext() {
    let nextValue;

    if (this.isStringIncrement) {
      nextValue = this.initialValue + this.currentValue;
    } else {
      nextValue = this.currentValue;
    }
    this.currentValue += this.increment;
    return nextValue;
  }
}

module.exports = Collection;
