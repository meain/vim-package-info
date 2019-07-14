const utils = require("./utils.js");
const Store = require("./more.js").default;
const render = require("./render.js");

const PackageJson = require("./package-json.js").default;
const CargoParser = require("./cargo.js").default;

let globalHandle = null;
function callRenderer(confType, dep) {
  const parser = getPackageParser(confType);
  if (globalHandle) parser.render(globalHandle, dep);
}

// I think each excecution starts fresh but with same interpretter
if (!("store" in global)) {
  global.store = new Store({}, callRenderer);
  global.bufferHash = null; // use timestamp for now
}

// do not move to utils, will create cyclic dependency
function getPackageParser(confType) {
  switch (confType) {
    case "rust":
      return new CargoParser();
      break;
    case "javascript":
      return new PackageJson();
      break;
  }
}

async function run(handle) {
  globalHandle = handle;
  global.bufferHash = +new Date();
  await render.clearAll(handle);

  const buffer = await handle.nvim.buffer;
  const bufferLines = await buffer.getLines();
  const bufferContent = bufferLines.join("\n");

  const filePath = await handle.nvim.commandOutput("echo expand('%')"); // there should be a better, I just don't know
  const confType = utils.determineFileKind(filePath);

  const parser = getPackageParser(confType);
  const depList = parser.getDeps(bufferContent);
  parser.updatePackageVersions(depList);
  parser.updateCurrentVersions(depList, filePath);
}

module.exports = handle => {
  handle.setOptions({ dev: false });

  ["BufEnter", "InsertLeave", "TextChanged"].forEach(e => {
    handle.registerAutocmd(e, async () => await run(handle), {
      pattern: "*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml",
    });
  });
};
