const assert = require("assert");
const utils = require("../rplugin/node/vim-package-info/utils");

const tests = require("./options").tests;

tests.forEach(test => {
  const fileKind = utils.determineFileKind(test.file);

  describe(test.name, function() {
    describe("utils", function() {
      it("return proper url", function() {
        assert.equal(utils.getUrl(test.tests.url.package, fileKind), test.tests.url.url);
      });
    });
  });
});
