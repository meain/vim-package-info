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

function determineFileKind(filename) {
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

async function fetchInfo(package, confType, vuln = false) {
  return new Promise((accept, reject) => {
    const url = getUrl(package, confType);
    if (url)
      https
        .get(url, resp => {
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

function save(package, confType, version, vuln = false) {
  // TODO: refactor vuln
  if (vuln) {
    global.viminfovulncache[confType][package] = version;
  } else {
    global.vimnpmcache[confType][package] = version;
  }
}

function load(package, confType, vuln = false) {
  if (vuln) {
    if (package in global.viminfovulncache[confType])
      return global.viminfovulncache[confType][package];
  } else {
    if (package in global.vimnpmcache[confType]) return global.vimnpmcache[confType][package];
  }
  return false;
}

module.exports = {
  fetchInfo,
  getLatestVersion,
  save,
  load,
  getUrl,
  getConfigValues,
  determineFileKind,
};
