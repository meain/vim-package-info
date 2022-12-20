const utils = require("../utils");
const render = require("../render");
const rutils = require("../render_utils");

const LANGUAGE = "python:requirements";
const markers = null;
const nameRegex = /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/;

class RequirementsTxt {
  getDeps(bufferContent) {
    const depList = [];

    for (let line of bufferContent.split("\n")) {
      const vals = line.match(nameRegex);
      if (vals !== null && vals !== undefined && 1 in vals) {
        const dep = vals[1].trim();
        let semver_version = null;

        const version_part = line.split("==")[1];
        if (version_part) {
          const version_matches = version_part.match(/(\d+\.)?(\d+\.)?(\*|\d+)/);
          if (version_matches.length > 0) {
            semver_version = version_matches[0];
          }
        }

        global.store.set(LANGUAGE, dep, { semver_version, current_version: semver_version });
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

  updateCurrentVersions() {
    // no specific lockfile, copy semver_version to current_version
    // taken care in getDeps
  }

  async render(handle, dep) {
    // TODO: maybe move this to a baseclass
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

module.exports = { default: RequirementsTxt };
