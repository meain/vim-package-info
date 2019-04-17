const utils = require("./utils");
const diff = require("./diff");
const parser = require("./parser");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
}

let prefix = "  ¤ ";
let hl_group = "NonText";

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

async function formatLatest(package, version, hl, confType) {
  const latest = await getLatest(package, confType);
  let lpf = [[`${prefix}No package available`, hl]];
  if (latest) {
    const cd = diff.colorizeDiff(version, latest, hl);
    if (cd) {
      let cdf = cd.reduce((acc, cdi) => {
        return [...acc, cdi, [".", cdi[1]]];
      }, []);
      cdf.splice(cdf.length - 1);
      lpf = [[`${prefix}latest:`, hl], ...cdf];
    }
  }
  return lpf;
}

async function fetchAll(nvim) {
  const buffer = await nvim.nvim.buffer;
  const bf = await buffer.getLines();
  const confType = await nvim.nvim.commandOutput("echo expand('%')");

  // old deps ( do not wanna break anything )
  try {
    prefix = await nvim.nvim.eval("g:vim_package_json_virutaltext_prefix");
  } catch (error) {}
  try {
    hl_group = await nvim.nvim.eval("g:vim_package_json_virutaltext_highlight");
  } catch (error) {}

  try {
    prefix = await nvim.nvim.eval("g:vim_package_info_virutaltext_prefix");
  } catch (error) {}
  try {
    hl_group = await nvim.nvim.eval("g:vim_package_info_virutaltext_highlight");
  } catch (error) {}

  let dep_lines = parser.getDepLines(bf, confType);

  dep_lines.forEach(async dl => {
    dl[1] = dl[1] - 1;

    if (dl[1] < dl[0] || dl[1] < 0) return;

    for (let i = dl[0]; i < dl[1]; i++) {
      if (bf[i].trim() === "") continue;

      const package = parser.getPackageInfo(bf[i], confType);
      let lp = [""];
      try {
        lp = await formatLatest(package.name, package.version, hl_group, confType);
      } catch (error) {
        console.log("error", error);
      }

      await buffer.setVirtualText(1, parseInt(i), [...lp]);
    }
  });
}

async function cleanAll(nvim) {
  await nvim.nvim.buffer.clearNamespace({ nsId: 1 });
}

module.exports = nvim => {
  nvim.setOptions({ dev: true });

  nvim.registerAutocmd(
    "BufEnter",
    async () => {
      await fetchAll(nvim);
    },
    {
      pattern: "Cargo.toml"
    }
  );
  nvim.registerAutocmd(
    "BufEnter",
    async () => {
      await fetchAll(nvim);
    },
    {
      pattern: "package.json"
    }
  );

  nvim.registerAutocmd(
    "InsertLeave",
    async () => {
      await cleanAll(nvim);
      await fetchAll(nvim);
    },
    {
      pattern: "Cargo.toml"
    }
  );
  nvim.registerAutocmd(
    "InsertLeave",
    async () => {
      await cleanAll(nvim);
      await fetchAll(nvim);
    },
    {
      pattern: "package.json"
    }
  );
};
