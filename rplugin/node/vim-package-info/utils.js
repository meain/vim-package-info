const path = require("path");
const https = require("follow-redirects").https;

if (!("vimnpmcache" in global)) {
  // you might think that we do not have to have two diffent objects
  // but there might be a single project with both package.json and Cargo.toml
  global.vimnpmcache = {
    javascript: {},
    rust: {},
    "python:requirements": {},
    "python:pipfile": {},
    "python:pyproject": {},
  };
  global.viminfovulncache = {
    javascript: {},
    rust: {},
    "python:requirements": {},
    "python:pipfile": {},
    "python:pyproject": {},
  };
}

function determineFileKind(filePath) {
  const filename = path.basename(filePath);

  if (filename.match(/^.*?requirements.txt$/)) {
    return "python:requirements";
  }
  if (filename.match(/^pyproject.toml$/)) {
    return "python:pyproject";
  }
  if (filename.match(/^Pipfile/)) {
    return "python:pipfile";
  }
  if (filename.match(/^Cargo.toml$/)) {
    return "rust";
  }
  if (filename.match(/^package.json$/)) {
    return "javascript";
  }
}

function getUrl(package, confType) {
  switch (confType) {
    case "javascript":
      return `https://registry.npmjs.org/${package}`;
    case "rust":
      return `https://crates.io/api/v1/crates/${package}`;
    case "python:requirements":
    case "python:pipfile":
    case "python:pyproject":
      return `https://pypi.org/pypi/${package}/json`;
    default:
      return false;
  }
}

function getLatestVersion(data, confType) {
  data = JSON.parse(data);
  switch (confType) {
    case "javascript":
      if ("dist-tags" in data) {
        return data["dist-tags"].latest;
      }
      break;
    case "rust":
      if ("crate" in data) {
        return data["crate"].max_version;
      }
      break;
    case "python:requirements":
    case "python:pipfile":
    case "python:pyproject":
      if ("info" in data) {
        return data["info"].version;
      }
      break;
  }
  return false;
}

const gf = function(s, char) {
  var arr = new Array();
  arr[0] = s.substring(0, s.indexOf(char));
  arr[1] = s.substring(s.indexOf(char) + 1);
  return arr;
};

async function fetcher(url) {
  return new Promise((accept, reject) => {
    const options = {
      headers: { "User-Agent": "vim-package-info (github.com/meain/vim-package-info)" },
    };
    if (url)
      https
        .get(url, options, resp => {
          let data = "";
          resp.on("data", chunk => {
            data += chunk;
          });
          resp.on("end", () => {
            accept(data);
          });
        })
        .on("error", err => {
          console.log("Error: " + err.message);
          reject(false);
        });
    else reject(false);
  });
}

async function fetchInfo(package, confType) {
  return new Promise((accept, reject) => {
    const url = getUrl(package, confType);
    const options = {
      headers: { "User-Agent": "vim-package-info (github.com/meain/vim-package-info)" },
    };
    if (url)
      https
        .get(url, options, resp => {
          let data = "";
          resp.on("data", chunk => {
            data += chunk;
          });
          resp.on("end", () => {
            accept(data);
          });
        })
        .on("error", err => {
          console.log("Error: " + err.message);
          global.vimnpmcache[confType][package] = false;
          reject(false);
        });
    else reject(false);
  });
}

async function getConfigValues(nvim) {
  let prefix = "  ¤ ";
  let hl_group = "NonText";

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

  return { prefix, hl_group };
}

function save(package, confType, data, vuln = false) {
  // TODO: refactor vuln
  if (vuln) {
    global.viminfovulncache[confType][package] = data;
  } else {
    global.vimnpmcache[confType][package] = data;
  }
}

function load(package, confType, vuln = false) {
  if (vuln) {
    if (package in global.viminfovulncache[confType])
      return global.viminfovulncache[confType][package];
  } else {
    if (package in global.vimnpmcache[confType]) return global.vimnpmcache[confType][package];
  }
  return null;
}

function createVulStats(vulnerabilities, package) {
  let vv = [`## Vulnerabilities for ${package}`, "", ""];
  for (let v of vulnerabilities) {
    vv.push(`### ${v.title}${v.cwe ? `(${v.cwe})` : ""}`);
    vv.push("");
    vv.push(v.description);
    vv.push(v.reference);
    vv.push("");
    vv.push("");
  }
  console.log("vv:", vv);
  return vv;
}

module.exports = {
  fetcher,
  fetchInfo,
  getLatestVersion,
  save,
  load,
  getUrl,
  getConfigValues,
  determineFileKind,
  createVulStats,
};
