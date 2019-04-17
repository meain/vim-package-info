const https = require("https");

if (!("vimnpmcache" in global)) {
  global.vimnpmcache = {};
}

async function getLatest(package) {
  return new Promise(accept => {
    if (package in global.vimnpmcache) {
      accept(`Latest ${global.vimnpmcache[package]}`);
    } else {
      https
        .get(`https://registry.npmjs.org/${package}`, resp => {
          let data = "";
          resp.on("data", chunk => {
            data += chunk;
          });
          resp.on("end", () => {
            const lp = JSON.parse(data)["dist-tags"].latest;
            global.vimnpmcache[package] = lp;
            accept(`Latest ${lp}`);
          });
        })
        .on("error", err => {
          console.log("Error: " + err.message);
          accept("No package available");
        });
    }
  });
}

function getPackageName(line) {
  const re = /"(.*)" *:/;
  const vals = re.exec(line);
  if (1 in vals) return vals[1];
  return "-----------------------------------------";
}

function getDepLines(bf, devDep = false) {
  let spos = -1;
  let epos = -1;
  for (let i = 0; i < bf.length; i++) {
    if (bf[i].indexOf(devDep ? '"devDependencies"' : '"dependencies"') !== -1) {
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

  let dep_lines = [getDepLines(bf), getDepLines(bf, true)];

  dep_lines.forEach(async dl => {
    dl[1] = dl[1] - 1;

    if (dl[1] < dl[0] || dl[1] < 0) return;

    for (let i = dl[0]; i < dl[1]; i++) {
      const package = getPackageName(bf[i]);
      let lp = "No package available";
      try {
        lp = await getLatest(package);
      } catch (error) {
        console.log("error", error);
      }

      await buffer.setVirtualText(1, parseInt(i), [[lp]]);
    }
  });
}

async function cleanAll(nvim) {
  const buffer = await nvim.nvim.buffer;
  await buffer.clearNamespace({ nsId: 1 });
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
