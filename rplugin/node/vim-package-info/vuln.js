const https = require("follow-redirects").https;
const utils = require("./utils");

function getCoordinates(package, version, confType) {
  switch (confType) {
    case "javascript":
      return `pkg:npm/${package}@${version.match(/(\d+\.)?(\d+\.)?(\*|\d+)/)[0]}`;
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

async function fetchVulns(packages, confType) {
  return new Promise((accept, reject) => {
    let coordinates = [];
    for (let package of packages) {
      coordinates.push({
        name: package.details.name,
        version: package.details.version,
        coordinate: getCoordinates(package.details.name, package.details.version, confType),
      });
    }
    const c = coordinates.map(c => c.coordinate);
    const data = JSON.stringify({ coordinates: c });
    const options = {
      hostname: "ossindex.sonatype.org",
      port: 443,
      path: "/api/v3/component-report",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    let req = https
      .request(options, resp => {
        let data = "";
        resp.on("data", chunk => {
          data += chunk;
        });
        resp.on("end", () => {
          let parsed = JSON.parse(data);
          accept(parsed);
        });
      })
      .on("error", err => {
        console.log("Error: " + err.message);
        reject(false);
      });

    req.write(data);
    req.end();
  });
}

async function isVulnerable(package, confType, version) {
  const cachedVersion = utils.load(package + "@" + version, confType, true);
  if (cachedVersion) return cachedVersion;
  else return false;
}

async function populateVulnStats(packages, confType) {
  try {
    let data = await fetchVulns(packages, confType);
    if (!data) return false;
    for (let i in data) {
      const dp = data[i];
      const package = packages[i].details;

      const vulnerable = dp.hasOwnProperty("vulnerabilities") && dp.vulnerabilities.length > 0;
      utils.save(package.name + "@" + package.version, confType, vulnerable, true);
    }
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { fetchVulns, populateVulnStats, isVulnerable };
