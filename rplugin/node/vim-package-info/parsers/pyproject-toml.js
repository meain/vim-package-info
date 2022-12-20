const fs = require("fs");
const path = require("path");
const toml = require("toml");

const utils = require("../utils");
const render = require("../render");
const rutils = require("../render_utils");

const LANGUAGE = "python:pyproject";
const depGroups = ["dependencies", "dev-dependencies"];
const markers = [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]];
const nameRegex = /['|"]?([a-zA-Z0-9\-_]*)['|"]? *=.*/;

class PyprojectToml {
  getDeps(bufferContent) {
    const data = toml.parse(bufferContent)["tool"]["poetry"];
    const depList = [];

    for (let dg of depGroups) {
      if (dg in data)
        for (let dep in data[dg]) {
          global.store.set(LANGUAGE, dep, { semver_version: data[dg][dep] });
          depList.push(dep);
        }
    }

    console.log("depList:", depList);
    return depList;
  }

  updatePackageVersions(depList) {
    for (let dep of depList) {
      if ("latest" in global.store.get(LANGUAGE, dep)) return;

      const fetchURL = `https://pypi.org/pypi/${dep}/json`;
      utils.fetcher(fetchURL).then(data => {
        data = JSON.parse(data);
        const latest = data.info.version;
        console.log("latest:", latest);
        const versions = Object.keys(data["releases"]);
        global.store.set(LANGUAGE, dep, { latest, versions });
      });
    }
  }

  updateCurrentVersions(depList, filePath) {
    const dir = path.dirname(filePath);
    const lock_filename = path.join(dir, "poetry.lock");

    if (fs.existsSync(lock_filename)) {
      const lockfile_content = toml.parse(fs.readFileSync(lock_filename, "utf-8"));
      for (let pack of lockfile_content["package"]) {
        global.store.set(LANGUAGE, pack.name, {
          current_version: pack.version || null,
        });
      }
    }
  }

  async render(handle, dep) {
    const buffer = await handle.nvim.buffer;
    const bufferLines = await buffer.getLines();

    const info = global.store.get(LANGUAGE, dep);
    const lineNumbers = rutils.getDepLines(bufferLines, markers, nameRegex, dep, true);
    // TODO: switch from latest_version to latest_semver satisfied version
    const isVulnerable = "vulnerabilities" in info && info.vulnerabilities.length > 0;
    for (let ln of lineNumbers) {
      await render.drawOne(handle, ln, info.current_version, info.latest, isVulnerable);
    }
  }
}

module.exports = { default: PyprojectToml };
