const fs = require("fs");
const assert = require("assert");
const parser = require("../rplugin/node/vim-package-info/parser");
const utils = require("../rplugin/node/vim-package-info/utils");

const cargo_toml_file = String(fs.readFileSync("examples/Cargo.toml"));

describe("cargo_toml", function() {
  describe("utils", function() {
    it("return proper url", function() {
      assert.equal(utils.getUrl("libc", "Cargo.toml"), "https://crates.io/api/v1/crates/libc");
    });
  });

  describe("parser", function() {
    it("gets proper dep lines", function() {
      assert.deepEqual(parser.getDepLines(cargo_toml_file.split("\n"), "Cargo.toml"), {
        "build-dependencies": [18, 22],
        "dev-dependencies": [33, 36],
        dependencies: [22, 29],
      });
    });

    const data = { dependencies: { "libc": "8.2.6", "serde": {"version":"~1.0" } }};
    it("gets proper version extracted", function() {
      assert.deepEqual(
        parser.getPackageInfo('libc = "8.2.6",', "Cargo.toml", data, "dependencies"),
        {
          name: "libc",
          version: "8.2.6",
        }
      );

      assert.deepEqual(
        parser.getPackageInfo(
          'serde = { version = "~1.0",  features = ["derive"] }',
          "Cargo.toml",
          data,
          "dependencies"
        ),
        {
          name: "serde",
          version: "~1.0",
        }
      );
    });
  });
});
