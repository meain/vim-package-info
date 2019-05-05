const https = require("follow-redirects").https;
const utils = require("./utils");

let lastRequestTime = null;

function getCoordinates(package, version, confType) {
  const tag = `${package}@${version.match(/(\d+\.)?(\d+\.)?(\*|\d+)/)[0]}`;
  switch (confType) {
    case "javascript":
      return `pkg:npm/${tag}`;
    case "rust":
      return `pkg:cargo/${tag}`;
    case "python:requirements":
    case "python:pipfile":
    case "python:pyproject":
      return `pkg:pypi/${tag}`;
    default:
      return false;
  }
}

async function fetchVulns(packages, confType) {
  return new Promise((accept, reject) => {
    const firstRun = lastRequestTime === null ? true : false
    setTimeout(
      () => {
        if (!firstRun && lastRequestTime > new Date().getTime() - 2500) accept([]);

        let coordinates = [];
        for (let package of packages) {
          const cachedVersion = utils.load(
            package.details.name + "@" + package.details.version,
            confType,
            true
          );
          if (cachedVersion === null)
            coordinates.push({
              name: package.details.name,
              version: package.details.version,
              coordinate: getCoordinates(package.details.name, package.details.version, confType),
            });
        }
        coordinates = coordinates.splice(0, 119);
        console.log(coordinates.length, coordinates);
        if (coordinates.length === 0) accept([]);
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
      },
      lastRequestTime === null ? 0 : 3000
    );
    lastRequestTime = new Date().getTime();
  });
}

function getVulnerability(package, version, confType){
  const cachedVersion = utils.load(package + "@" + version, confType, true);
  if (cachedVersion !== null) return cachedVersion;
  else return false;
}

async function isVulnerable(package, confType, version) {
  const cachedVersion = utils.load(package + "@" + version, confType, true);
  if (cachedVersion !== null) return cachedVersion.vulnerabilities.length > 0;
  else return false;
}

async function populateVulnStats(packages, confType) {
  try {
    let data = await fetchVulns(packages, confType);
    if (!data) return false;
    for (let i in data) {
      const dp = data[i];
      const splits = dp.coordinates.split("/");
      const tag = splits[splits.length - 1];

      // const vulnerable = dp.hasOwnProperty("vulnerabilities") && dp.vulnerabilities.length > 0;
      utils.save(tag, confType, dp, true);
    }
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { fetchVulns, populateVulnStats, isVulnerable, getVulnerability };
