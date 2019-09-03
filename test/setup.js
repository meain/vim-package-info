const Store = require("../rplugin/node/vim-package-info/more.js").default;

const render = (lang, dep, value) => console.log(lang, dep, value);
global.store = new Store({}, render);
