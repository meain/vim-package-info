const fs = require("fs");
const assert = require("assert");

const Parser = require("../rplugin/node/vim-package-info/package-json.js").default;

const file = fs.readFileSync(`examples/package.json`, "utf-8");

describe("package.json", function() {
  it("returns all deps", function() {
    const p = new Parser();
    const depList = p.getDeps(file);
    assert.deepEqual(depList, [
      "babel-eslint",
      "color-hash",
      "express",
      "preact-compat",
      "react",
      "react-dom",
      "sweetalert2",
      "why-did-you-update",
      "eslint",
      "eslint-config-airbnb",
      "eslint-loader",
      "flow-bin",
    ]);

    p.updateCurrentVersions([depList[0]], "examples/package.json");
  });
});
