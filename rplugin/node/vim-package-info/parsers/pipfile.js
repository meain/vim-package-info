const fs = require("fs");
const path = require("path");
const toml = require("toml");

const utils = require("../utils");
const render = require("../render");
const rutils = require("../render_utils");

const LANGUAGE = "python:pipfile";
const depGroups = ["packages", "dev-packages"];
const markers = [[/\[(packages)\]/, /^ *\[.*\].*/], [/\[(dev-packages)\]/, /^ *\[.*\].*/]];
const nameRegex = /"?([a-zA-Z0-9\-_]*)"? *=.*/;

class PipfileParser {
  getDeps(bufferContent) {
    const data = toml.parse(bufferContent);
    const depList = [];

    for (let dg of depGroups) {
      if (dg in data)
        for (let dep in data[dg]) {
          global.store.set(LANGUAGE, dep, { semver_version: data[dg][dep] });
          depList.push(dep);
        }
    }

    return depList;
  }

  updatePackageVersions(depList) {
    for (let dep of depList) {
      if ("latest" in global.store.get(LANGUAGE, dep)) return;

      const fetchURL = `https://pypi.org/pypi/${dep}/json`;
      utils.fetcher(fetchURL).then(data => {
        data = JSON.parse(data);
        const latest = data.info.version;
        const versions = Object.keys(data["releases"]);
        global.store.set(LANGUAGE, dep, { latest, versions });
      });
    }
  }

  updateCurrentVersions(depList, filePath) {
    const dir = path.dirname(filePath);
    const lock_filename = path.join(dir, "Pipfile.lock");

    if (fs.existsSync(lock_filename)) {
      const lockfile_content = JSON.parse(fs.readFileSync(lock_filename, "utf-8"));
      for (let dep of depList) {
        for (let dg of ["default", "develop"]) {
          if (dg in lockfile_content && dep in lockfile_content[dg]) {
            global.store.set(LANGUAGE, dep, {
              current_version: lockfile_content[dg][dep]["version"] || null, // TODO:  contains == in the beginning, thing about it
            });
            break;
          }
        }
      }
    }
  }

  async render(handle, dep) {
    // this could be in the baseclass
    const buffer = await handle.nvim.buffer;
    const bufferLines = await buffer.getLines();

    const info = global.store.get(LANGUAGE, dep);

    // TODO: switch from latest_version to latest_semver satisfied version
    const lineNumbers = rutils.getDepLines(bufferLines, markers, nameRegex, dep, true);
    const isVulnerable = "vulnerabilities" in info && info.vulnerabilities.length > 0;
    for (let ln of lineNumbers) {
      await render.drawOne(handle, ln, info.current_version, info.latest, isVulnerable);
    }
  }
}

module.exports = { default: PipfileParser };
