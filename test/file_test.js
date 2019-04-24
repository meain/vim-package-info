const fs = require("fs");
const assert = require("assert");
const parser = require("../rplugin/node/vim-package-info/parser");
const utils = require("../rplugin/node/vim-package-info/utils");

const tests = require("./options").tests;

tests.forEach(test => {
  const file = String(fs.readFileSync(`examples/${test.file}`));

  const fileKind = utils.determineFileKind(test.file);

  describe(test.name, function() {
    describe("utils", function() {
      it("return proper url", function() {
        assert.equal(utils.getUrl(test.tests.url.package, fileKind), test.tests.url.url);
      });
    });

    describe("parser", function() {
      it("gets proper dep lines", function() {
        assert.deepEqual(parser.getDepLines(file.split("\n"), fileKind), test.tests.dep_lines);
      });

      it("gets proper version extracted", function() {
        test.tests.version_extraction.checks.forEach(line => {
          assert.deepEqual(
            parser.getPackageInfo(
              line.line,
              fileKind,
              test.tests.version_extraction.data,
              line.depSelector
            ),
            line.output
          );
        });
      });
    });
  });
});
