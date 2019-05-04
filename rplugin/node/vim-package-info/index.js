const path = require("path");
const utils = require("./utils");
const diff = require("./diff");
const parser = require("./parser");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
  global.previousBuffer = null;
}

async function getLatest(package, confType) {
  const cachedVersion = utils.load(package, confType);
  if (cachedVersion) return cachedVersion;

  const data = await utils.fetchInfo(package, confType);
  if (!data) {
    utils.save(package, confType, false);
    return false;
  }

  const version = utils.getLatestVersion(data, confType);
  utils.save(package, confType, version);
  if (!version) return false;

  return version;
}

async function format(package, version, prefix, hl, latest) {
  let lpf = [[`${prefix}No package available`, hl]];
  if (latest) {
    const cd = diff.colorizeDiff(version, latest, hl);
    if (cd) {
      let cdf = cd.reduce((acc, cdi) => {
        return [...acc, cdi, [".", cdi[1]]];
      }, []);
      cdf.splice(cdf.length - 1);
      lpf = [[`${prefix}latest: `, hl], ...cdf];
    }
  }
  return lpf;
}

async function drawOne(nvim, package, latest) {
  const buffer = await nvim.nvim.buffer;

  const lineNum = package.line;
  const details = package.details;

  const { prefix, hl_group } = await utils.getConfigValues(nvim);

  const lp = await format(details.name, details.version, prefix, hl_group, latest);
  await buffer.setVirtualText(1, lineNum, [...lp]);
}

async function redraw(nvim, cbf, confType, packageList) {
  const buffer = await nvim.nvim.buffer;
  const nbf = await buffer.getLines();

  if (cbf.join("\n") !== nbf.join("\n")) await cleanAll(nvim);

  for (let package of packageList) {
    const latest = await getLatest(package.details.name, confType);
    if (cbf.join("\n") === nbf.join("\n")) await drawOne(nvim, package, latest);
  }
}

function parseLines(confType, buffer, data) {
  const packageList = [];
  let depGroups = parser.getDepLines(buffer, confType);

  Object.keys(depGroups).forEach(async dgk => {
    const dl = depGroups[dgk];
    dl[1] = dl[1] - 1;

    if (dl[1] < dl[0] || dl[1] < 0) return;

    for (let i = dl[0]; i < dl[1]; i++) {
      if (buffer[i].trim() === "") continue; // do not evaluate empty lines

      const package = parser.getPackageInfo(buffer[i], confType, data, dgk);
      if (package.name === undefined) continue;
      packageList.push({ line: parseInt(i), details: package });
    }
  });

  return packageList;
}

async function start(nvim) {
  const buffer = await nvim.nvim.buffer;
  const bf = await buffer.getLines();

  const filePath = await nvim.nvim.commandOutput("echo expand('%')");
  const fileType = await nvim.nvim.commandOutput("echo &filetype");

  const filename = path.basename(filePath);
  const confType = utils.determineFileKind(filename);

  // done here so as to check if the file is parseable
  let data = parser.getParsedFile(bf.join("\n"), fileType);
  if (!data) return;

  const packageList = parseLines(confType, bf, data);

  await redraw(nvim, bf, confType, packageList);
}

async function cleanAll(nvim) {
  await nvim.nvim.buffer.clearNamespace({ nsId: 1 });
}

module.exports = nvim => {
  nvim.setOptions({ dev: true });

  ["BufEnter", "InsertLeave", "TextChanged"].forEach(e => {
    nvim.registerAutocmd(e, async () => await start(nvim), {
      pattern: "*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml"
    });
  });
};
