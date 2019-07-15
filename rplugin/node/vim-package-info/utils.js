const path = require("path");
const https = require("follow-redirects").https;

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

// TODO: make use of this
function getUrl(dep, confType) {
  switch (confType) {
    case "javascript":
      return `https://registry.npmjs.org/${dep}`;
    case "rust":
      return `https://crates.io/api/v1/crates/${dep}`;
    case "python:requirements":
    case "python:pipfile":
    case "python:pyproject":
      return `https://pypi.org/pypi/${dep}/json`;
    default:
      return false;
  }
}

// TODO: make this the only way to get this info + do for markers
function getNameRegex(confType) {
  return {
    javascript: /['|"](.*)['|"] *:/,
    rust: /([a-zA-Z0-9\-_]*) *=.*/,
    "python:requirements": /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/,
    "python:pipfile": /"?([a-zA-Z0-9\-_]*)"? *=.*/,
    "python:pyproject": /['|"]?([a-zA-Z0-9\-_]*)['|"]? *=.*/,
  }[confType];
}

function getDepMarkers(confType) {
  // [ [start, end], [start, end] ]
  return {
    javascript: [[/["|'](dependencies)["|']/, /\}/], [/["|'](devDependencies)["|']/, /\}/]],
    rust: [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]],
    "python:requirements": null,
    "python:pipfile": [[/\[(packages)\]/, /^ *\[.*\].*/], [/\[(dev-packages)\]/, /^ *\[.*\].*/]],
    "python:pyproject": [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]],
  }[confType];
}

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
        });
    else {
      console.log("Error: no url provided" );
    }
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

// TODO: move to vulnerabilities.js file
function createVulStats(vulnerabilities, dep) {
  let vv = [`# Vulnerabilities for ${dep}`, "", ""];
  for (let v of vulnerabilities) {
    vv.push(`## ${v.title}${v.cwe ? `(${v.cwe})` : ""}`);
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
  getUrl,
  getConfigValues,
  determineFileKind,
  createVulStats,
  getNameRegex,
  getDepMarkers,
};
