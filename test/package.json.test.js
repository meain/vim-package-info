const fs = require("fs");
const assert = require("assert");
const parser = require("../rplugin/node/vim-package-info/parser");
const utils = require("../rplugin/node/vim-package-info/utils");

const package_json_file = String(fs.readFileSync("examples/package.json"));

describe("package.json", function() {
  describe("utils", function() {
    it("return proper url", function() {
      assert.equal(utils.getUrl("mocha", "package.json"), "https://registry.npmjs.org/mocha");
    });
  });

  describe("parser", function() {
    it("gets proper dep lines", function() {
      assert.deepEqual(parser.getDepLines(package_json_file.split("\n"), "package.json"), {
        dependencies: [5, 13],
        devDependencies: [22, 27],
      });
    });

    const data = { dependencies: { "babel-eslint": "^8.2.6", "why-did-you-update": "^0.1.1" } };
    it("gets proper version extracted", function() {
      assert.deepEqual(
        parser.getPackageInfo(
          '    "babel-eslint": "^8.2.6",',
          "package.json",
          data,
          "dependencies"
        ),
        {
          name: "babel-eslint",
          version: "^8.2.6",
        }
      );

      assert.deepEqual(
        parser.getPackageInfo(
          '    "why-did-you-update": "^0.1.1"',
          "package.json",
          data,
          "dependencies"
        ),
        {
          name: "why-did-you-update",
          version: "^0.1.1",
        }
      );
    });
  });
});
