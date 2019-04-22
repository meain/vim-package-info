const https = require("follow-redirects").https;

if (!("vimnpmcache" in global)) {
  // you might think that we do not have to have two diffent objects
  // but there might be a single project with both package.json and Cargo.toml
  global.vimnpmcache = {
    "package.json": {},
    "Cargo.toml": {},
    "requirements.txt": {},
  };
}

function getUrl(package, confType) {
  switch (confType) {
    case "package.json":
      return `https://registry.npmjs.org/${package}`;
    case "Cargo.toml":
      return `https://crates.io/api/v1/crates/${package}`;
    case "requirements.txt":
      return `https://pypi.org/pypi/${package}/json`;
    default:
      return false;
  }
}

function getLatestVersion(data, confType) {
  data = JSON.parse(data);
  switch (confType) {
    case "package.json":
      if ("dist-tags" in data) {
        return data["dist-tags"].latest;
      }
      break;
    case "Cargo.toml":
      if ("crate" in data) {
        return data["crate"].max_version;
      }
      break;
    case "requirements.txt":
      if ("info" in data) {
        return data["info"].version;
      }
      break;
  }
  return false;
}

async function fetchInfo(package, confType) {
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
          global.vimnpmcache[package] = false;
          reject(false);
        });
    else reject(false);
  });
}

function save(package, confType, version) {
  global.vimnpmcache[confType][package] = version;
}

function load(package, confType) {
  if (package in global.vimnpmcache[confType]) return global.vimnpmcache[confType][package];
  return false;
}

module.exports = { fetchInfo, getLatestVersion, save, load, getUrl };
