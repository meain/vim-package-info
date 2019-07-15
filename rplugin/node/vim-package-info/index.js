const utils = require("./utils.js");
const Store = require("./more.js").default;
const render = require("./render.js");
const vulnerability = require("./vulnerability.js");

const PackageJson = require("./package-json.js").default;
const CargoParser = require("./cargo.js").default;
const RequirementsTxt = require("./requirements-txt.js").default;
const PipfileParser = require("./pipfile.js").default;
const PyprojectToml = require("./pyproject-toml.js").default;

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
    case "python:requirements":
      return new RequirementsTxt();
      break;
    case "python:pipfile":
      return new PipfileParser();
      break;
    case "python:pyproject":
      return new PyprojectToml();
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
  vulnerability.updateVulnerabilities(depList, confType);

}

module.exports = handle => {
  handle.setOptions({ dev: true });
  handle.registerCommand(
    "ShowVulnerabilities",
    async () => {
      try {
        vulnerability.showVulnerabilities(handle);
      } catch (err) {
        console.error(err);
      }
    },
    { sync: false }
  );

  ["BufEnter", "InsertLeave", "TextChanged"].forEach(e => {
    handle.registerAutocmd(e, async () => await run(handle), {
      pattern: "*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml",
    });
  });
};
