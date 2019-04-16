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

// async function showLatest(nvim, package) {
//   let lp = "No package available";
//   try {
//     lp = await getLatest(package);
//   } catch (error) {
//     console.log("error", error);
//   }
//
//   nvim.nvim.command(`echo ${lp}`);
// }

function getPackageName(line) {
  const re = /"(.*)" *:/;
  const vals = re.exec(line);
  if (1 in vals) return vals[1];
  return "-----------------------------------------";
}

function getDepLines(bf) {
  let spos = -1;
  let epos = -1;
  for (let i = 0; i < bf.length; i++) {
    if (bf[i].indexOf('"dependencies"') !== -1) {
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

  let dep_lines = getDepLines(bf);
  dep_lines[1] = dep_lines[1] - 1;

  if (dep_lines[1] < dep_lines[0] || dep_lines[1] < 0) return;

  for (let i = dep_lines[0]; i < dep_lines[1]; i++) {
    const package = getPackageName(bf[i]);
    let lp = "No package available";
    try {
      lp = await getLatest(package);
    } catch (error) {
      console.log("error", error);
    }

    // await buffer.clearNamespace({ nsId: 1 });
    await buffer.setVirtualText(1, parseInt(i), [[lp]]);
  }
}

// async function process(nvim) {
//   console.log("\n\n\n\n\n\n");
//
//   const buffer = await nvim.nvim.buffer;
//
//   const line = await nvim.nvim.line;
//   const line_num = await nvim.nvim.commandOutput("echo line('.')");
//   const dep_lines = getDepLines(await buffer.getLines());
//   console.log("dep_lines", dep_lines);
//   if (line_num > dep_lines[0] && line_num < dep_lines[1]) {
//     const package = getPackageName(line);
//     let lp = "No package available";
//     try {
//       lp = await getLatest(package);
//     } catch (error) {
//       console.log("error", error);
//     }
//
//     // await buffer.clearNamespace({ nsId: 1 });
//     // await buffer.setVirtualText(1, parseInt(line_num) - 1, [[lp]]);
//   } else {
//     await buffer.clearNamespace({ nsId: 1 });
//   }
// }

module.exports = nvim => {
  nvim.setOptions({ dev: true });

  // nvim.registerAutocmd(
  //   "CursorMoved",
  //   async () => {
  //     await process(nvim);
  //   },
  //   {
  //     pattern: "package.json*"
  //   }
  // );

  // add new items to cache on insert leave

  nvim.registerAutocmd(
    "BufEnter",
    async () => {
      await fetchAll(nvim);
    },
    {
      pattern: "package.json*"
    }
  );

  // Direactly call with package name and echo out the result
  // nvim.registerCommand(
  //   "FindLatestVersion",
  //   async arg => {
  //     console.log(arg);
  //     await showLatest(nvim);
  //   },
  //   {
  //     sync: true,
  //     pattern: "package.json*",
  //     eval: "expand('<afile>')"
  //   }
  // );
};
