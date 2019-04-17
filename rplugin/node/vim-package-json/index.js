const https = require("https");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
}

let prefix = "  ¤ ";
let hl_group = "NonText";

async function getLatest(package, version) {
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

async function formatLatest(package, version) {
  const latest = await getLatest(package);
  let lpf = `${prefix}No package available`;
  if (latest) {
    lpf = `${prefix}latest:${latest}`;
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
      let lp = "No package available";
      try {
        lp = await formatLatest(package.name, package.version);
      } catch (error) {
        console.log("error", error);
      }

      await buffer.setVirtualText(1, parseInt(i), [[lp, hl_group]]);
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
