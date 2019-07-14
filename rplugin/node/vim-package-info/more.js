// A super minimal store implementation with callback on insert event

class Store {
  constructor(initialValue = {}, callback) {
    this.store = initialValue;
    this.callback = callback;
  }

  get(lang = null, dep = null) {
    if (lang === null) return {};
    else if (dep === null) return this.store[lang][dep] || {};
    else return this.store[lang][dep];
  }

  set(lang, dep, value) {
    if (!(lang in this.store)) this.store[lang] = {};
    if (!(dep in this.store[lang])) this.store[lang][dep] = {};
    this.store[lang][dep] = {
      ...this.store[lang][dep],
      ...value,
    };
    this.callback(lang, dep, this.store[lang][dep]);
  }
}

module.exports = { default: Store };
