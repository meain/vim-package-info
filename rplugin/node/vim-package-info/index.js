const path = require("path");
const utils = require("./utils");
const vuln = require("./vuln");
const diff = require("./diff");
const parser = require("./parser");

// const axios = require("axios");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
  global.previousBuffer = null;
}

async function getLatest(package, confType) {
  const cachedVersion = utils.load(package, confType);
  if (cachedVersion !== null) return cachedVersion;

  let data = false;
  try {
    data = await utils.fetchInfo(package, confType);
  } catch (e) {
    console.error("Could not fetch package info");
  }
  if (!data) {
    utils.save(package, confType, false);
    return false;
  }

  const version = utils.getLatestVersion(data, confType);
  utils.save(package, confType, version);
  if (!version) return false;

  return version;
}

async function format(package, version, prefix, hl, latest, vulnerable = false) {
  let lpf = [[`${prefix}No package available`, hl]];
  if (latest) {
    const cd = diff.colorizeDiff(version, latest, hl);
    if (cd) {
      let cdf = cd.reduce((acc, cdi) => {
        return [...acc, cdi, [".", cdi[1]]];
      }, []);
      cdf.splice(cdf.length - 1);
      if (vulnerable) {
        lpf = [
          ["   ", hl],
          [" vulnerable ", "VimPackageInfoVulnerable"],
          [`${prefix}latest: `, hl],
          ...cdf,
        ];
      } else {
        lpf = [[`${prefix}latest: `, hl], ...cdf];
      }
    }
  }
  return lpf;
}

async function drawOne(nvim, package, latest, vulnerable) {
  const buffer = await nvim.nvim.buffer;

  const lineNum = package.line;
  const details = package.details;

  const { prefix, hl_group } = await utils.getConfigValues(nvim);

  const lp = await format(details.name, details.version, prefix, hl_group, latest, vulnerable);
  await buffer.setVirtualText(1, lineNum, [...lp]);
}

const reflect = (p, cb) =>
  p.then(
    v => {
      cb();
      return { v, status: "fulfilled" };
    },
    e => ({ e, status: "rejected" })
  );

async function populateLatestInfo(packageList, confType, cb) {
  let waiters = [];
  for (let package of packageList) {
    waiters.push(reflect(getLatest(package.details.name, confType), cb));
  }
  await Promise.all(waiters);
}

async function redraw(nvim, cbf, confType, packageList) {
  const buffer = await nvim.nvim.buffer;
  const nbf = await buffer.getLines();

  if (cbf.join("\n") !== nbf.join("\n")) await cleanAll(nvim);

  for (let package of packageList) {
    const latest = await getLatest(package.details.name, confType);
    const vulnerable = vuln.isVulnerable(package.details.name, confType, package.details.version);
    if (cbf.join("\n") === nbf.join("\n")) await drawOne(nvim, package, latest, vulnerable);
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

  await nvim.nvim.command(`echo "Fetching version info for ${packageList.length} packages..."`);
  await populateLatestInfo(packageList, confType, () => {
    redraw(nvim, bf, confType, packageList);
  });
  await nvim.nvim.command("echo ''");
  await redraw(nvim, bf, confType, packageList);

  await vuln.populateVulnStats(packageList, confType);
  await redraw(nvim, bf, confType, packageList);
}

async function cleanAll(nvim) {
  await nvim.nvim.buffer.clearNamespace({ nsId: 1 });
}

async function showVulnerabilities(nvim) {
  const buffer = await nvim.nvim.buffer;
  const bf = await buffer.getLines();

  const fileType = await nvim.nvim.commandOutput("echo &filetype");
  const filePath = await nvim.nvim.commandOutput("echo expand('%')");
  const filename = path.basename(filePath);
  const confType = utils.determineFileKind(filename);

  const lineNum = await nvim.nvim.commandOutput("echo line('.')");

  let data = parser.getParsedFile(bf.join("\n"), fileType);
  if (!data) return;

  const line = await nvim.nvim.getLine();
  let depGroups = parser.getDepLines(bf, confType);
  let dkg = null;
  for (let k of Object.keys(depGroups)) {
    if (depGroups[k][0] < lineNum && depGroups[k][1] > lineNum) {
      dkg = k;
    }
  }
  if (dkg === null) return;
  const package = parser.getPackageInfo(line, confType, data, dkg);
  if (package.name === undefined) return;

  const vulnerabilities = vuln.getVulnerability(package.name, package.version, confType);
  if (!vulnerabilities)
    await nvim.nvim.outWrite(
      `No vulnerabilities for ${package.name}@${
        package.version.match(/(\d+\.)?(\d+\.)?(\*|\d+)/)[0]
      }\n`
    );
  const vList = utils.createVulStats(
    vulnerabilities.vulnerabilities,
    `${package.name}@${package.version}`
  );
  await nvim.nvim.command("topleft new");
  await nvim.nvim.command("set ft=markdown");
  await nvim.nvim.buffer.insert(vList, 0);
  [
    "nobuflisted",
    "nolist",
    "bufhidden=wipe",
    "setlocal buftype=nofile",
    "setlocal bufhidden=hide",
  ].map(async c => {
    await nvim.nvim.command(c);
  });
}

module.exports = nvim => {
  nvim.setOptions({ dev: false });

  nvim.registerCommand(
    "ShowVulnerabilities",
    async () => {
      try {
        await showVulnerabilities(nvim);
      } catch (err) {
        console.error(err);
      }
    },
    { sync: false }
  );

  ["BufEnter", "InsertLeave", "TextChanged"].forEach(e => {
    nvim.registerAutocmd(e, async () => await start(nvim), {
      pattern: "*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml",
    });
  });
};
