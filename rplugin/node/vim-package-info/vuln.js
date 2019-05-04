const https = require("follow-redirects").https;

function getCoordinates(package, version, confType) {
  const base = "https://ossindex.sonatype.org/api/v3/component-report/";
  switch (confType) {
    case "javascript":
      return `${base}pkg:npm/${package}@${version}`;
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

async function fetchVuln(package, confType, version) {
  return new Promise((accept, reject) => {
    const url = getCoordinates(package, version, confType);
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
          global.viminfovulncache[confType][package] = false;
          reject(false);
        });
    else reject(false);
  });
}

module.exports = { fetchVuln };
