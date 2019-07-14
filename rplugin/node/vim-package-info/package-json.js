const fs = require("fs");
const path = require("path");
const lockfile = require("@yarnpkg/lockfile");

const utils = require("./utils");
const render = require("./render");
const rutils = require("./render_utils");
const LANGUAGE = "javascript";

class PackageJson {
  getDeps(bufferContent) {
    const data = JSON.parse(bufferContent);
    const depList = [];

    if ("dependencies" in data)
      for (let dep in data["dependencies"]) {
        global.store.set(LANGUAGE, dep, { semver_version: data["dependencies"][dep] });
        depList.push(dep);
      }

    if ("devDependencies" in data)
      for (let dep in data["devDependencies"]) {
        global.store.set(LANGUAGE, dep, { semver_version: data["devDependencies"][dep] });
        depList.push(dep);
      }

    return depList;
  }

  updatePackageVersions(depList) {
    for (let dep of depList) {
      const fetchURL = `https://registry.npmjs.org/${dep}`;
      utils.fetcher(fetchURL).then(data => {
        data = JSON.parse(data);
        const latest = data["dist-tags"]["latest"];
        const versions = Object.keys(data["versions"]);
        global.store.set(LANGUAGE, dep, { latest, versions });
      });
    }
  }

  updateCurrentVersions(depList, filePath) {
    const dir = path.dirname(filePath);
    const npm_lock_filename = path.join(dir, "package-lock.json");
    const yarn_lock_filename = path.join(dir, "yarn.lock");

    if (fs.existsSync(npm_lock_filename)) {
      const lockfile_content = JSON.parse(fs.readFileSync(npm_lock_filename, "utf-8"));
      for (let dep of depList) {
        if ("dependencies" in lockfile_content && dep in lockfile_content["dependencies"])
          global.store.set(LANGUAGE, dep, {
            current_version: lockfile_content["dependencies"][dep]["version"] || null,
          });
        else if (
          "devDependencies" in lockfile_content &&
          dep in lockfile_content["devDependencies"]
        )
          global.store.set(LANGUAGE, dep, {
            current_version: lockfile_content["devDependencies"][dep]["version"] || null,
          });
      }
    } else if (fs.existsSync(yarn_lock_filename)) {
      const lockfile_content = lockfile.parse(fs.readFileSync(yarn_lock_filename, "utf-8"));
      for (let dep of depList) {
        for (let ld of Object.keys(lockfile_content["object"])) {
          if (ld.split("@")[0] === dep) {
            const current_version = lockfile_content["object"][ld].version;
            global.store.set(LANGUAGE, dep, {
              current_version,
            });
          }
        }
      }
    }
  }

  async render(handle, dep) {
    const buffer = await handle.nvim.buffer;
    const bufferLines = await buffer.getLines();

    const info = global.store.get(LANGUAGE, dep);
    const markers = [[/["|'](dependencies)["|']/, /\}/], [/["|'](devDependencies)["|']/, /\}/]];
    const nameRegex = /['|"](.*)['|"] *:/;

    const lineNumber = rutils.getDepLine(bufferLines, markers, nameRegex, dep);
    if (lineNumber)
      await render.drawOne(handle, lineNumber, info.current_version, info.latest, false);
  }
}

module.exports = { default: PackageJson };
