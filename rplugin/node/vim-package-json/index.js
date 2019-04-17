const https = require("https");
const _ = require("lodash");
var semverUtils = require("semver-utils");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
}

let prefix = "  ¤ ";
let hl_group = "NonText";

async function getLatest(package) {
  return new Promise(accept => {
    if (package in global.vimnpmcache) {
      if (global.vimnpmcache[package]) accept(global.vimnpmcache[package]);
      else accept(false);
    } else {
      https
        .get(`https://registry.npmjs.org/${package}`, resp => {
          let data = "";
          resp.on("data", chunk => {
            data += chunk;
          });
          resp.on("end", () => {
            const pata = JSON.parse(data);
            if ("dist-tags" in pata) {
              const lp = pata["dist-tags"].latest;
              global.vimnpmcache[package] = lp;
              accept(lp);
            } else {
              global.vimnpmcache[package] = false;
              accept(false);
            }
          });
        })
        .on("error", err => {
          console.log("Error: " + err.message);
          global.vimnpmcache[package] = false;
          accept(false);
        });
    }
  });
}

function colorizeDiff(current, latest, hl) {
  if (current[0] === "^" || current[0] === "~") current = current.substr(1);
  const c = semverUtils.parse(current);
  const l = semverUtils.parse(latest);

  let cd = [[l.major, hl], [l.minor, hl], [l.patch, hl]];
  if (parseInt(l.major) > parseInt(c.major)) {
    cd = [
      [l.major, "VimPackageJsonMajor"],
      [l.minor, "VimPackageJsonMajor"],
      [l.patch, "VimPackageJsonMajor"]
    ];
  } else if (parseInt(l.minor) > parseInt(c.minor)) {
    cd = [
      [l.major, hl],
      [l.minor, "VimPackageJsonMinor"],
      [l.patch, "VimPackageJsonMinor"]
    ];
  } else if (parseInt(l.patch) > parseInt(c.patch)) {
    cd = [[l.major, hl], [l.minor, hl], [l.patch, "VimPackageJsonPatch"]];
  }
  return cd;
}

async function formatLatest(package, version, hl) {
  const latest = await getLatest(package);
  let lpf = [[`${prefix}No package available`, hl]];
  if (latest) {
    // lpf = `${prefix}latest:${latest}`;
    const cd = colorizeDiff(version, latest, hl);
    let cdf = cd.reduce((acc, cdi) => {
      return [...acc, cdi, [".", cdi[1]]];
    }, []);
    cdf.splice(cdf.length - 1);
    lpf = [[`${prefix}latest:`, hl], ...cdf];
  }
  return lpf;
}

function getPackageInfo(line) {
  const info = { name: undefined, version: undefined };

  const re = /['|"](.*)['|"] *:/;
  const vals = re.exec(line);
  if (1 in vals) info["name"] = vals[1];

  const re2 = /: *['|"](.*)['|"]/;
  const vals2 = re2.exec(line);
  if (1 in vals2) info["version"] = vals2[1];

  return info;
}

function getDepLines(bf, devDep = false) {
  let spos = -1;
  let epos = -1;
  for (let i = 0; i < bf.length; i++) {
    if (bf[i].indexOf(devDep ? "devDependencies" : "dependencies") !== -1) {
      spos = i;
      for (let j = i; j < bf.length; j++) {
        if (bf[j].indexOf("}") !== -1) {
          epos = j;
          break;
        }
      }
      break;
    }
  }
  return [spos + 1, epos + 1];
}

async function fetchAll(nvim) {
  const buffer = await nvim.nvim.buffer;
  const bf = await buffer.getLines();

  try {
    prefix = await nvim.nvim.eval("g:vim_package_json_virutaltext_prefix");
  } catch (error) {}
  try {
    hl_group = await nvim.nvim.eval("g:vim_package_json_virutaltext_highlight");
  } catch (error) {}

  let dep_lines = [getDepLines(bf), getDepLines(bf, true)];

  dep_lines.forEach(async dl => {
    dl[1] = dl[1] - 1;

    if (dl[1] < dl[0] || dl[1] < 0) return;

    for (let i = dl[0]; i < dl[1]; i++) {
      const package = getPackageInfo(bf[i]);
      let lp = [""];
      try {
        lp = await formatLatest(package.name, package.version, hl_group);
        console.log("lp", lp);
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

  // remove all virtualtext on insert enter?
  // add new items to cache on insert leave and update the position of virtualtext
  // show in grey

  nvim.registerAutocmd(
    "BufEnter",
    async () => {
      await fetchAll(nvim);
    },
    {
      pattern: "package.json*"
    }
  );

  nvim.registerAutocmd(
    "InsertLeave",
    async () => {
      await cleanAll(nvim);
      await fetchAll(nvim);
    },
    {
      pattern: "package.json*"
    }
  );
};
