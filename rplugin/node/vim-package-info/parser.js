const toml = require("toml");

// Format:
// [ [start, end], [start, end] ]
const depMarkers = {
  "package.json": [
    [/["|'](dependencies)["|']/, /\}/],
    [/["|'](devDependencies)["|']/, /\}/]
  ],
  "Cargo.toml": [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]]
};
const nameParserRegex = {
  "package.json": /['|"](.*)['|"] *:/,
  "Cargo.toml": /([a-zA-Z0-9\-_]*) *=.*/
};

function isStart(line, confType) {
  for (let i = 0; i < depMarkers[confType].length; i++) {
    const dm = depMarkers[confType][i];
    const depGroup = line.match(dm[0]);
    if (depGroup) {
      return { depGroupName: depGroup[1], end: dm[1] };
    }
  }
  return false;
}

function getDepLines(bf, confType) {
  let spos = -1;
  let epos = -1;
  let groups = {};
  for (let i = 0; i < bf.length; i++) {
    const { end, depGroupName } = isStart(bf[i], confType);
    if (end) {
      spos = i;
      for (let j = i + 1; j < bf.length; j++) {
        if (end.test(bf[j])) {
          epos = j;
          break;
        }
      }
      groups[depGroupName] = [spos + 1, epos + 1];
      spos = -1;
      epos = -1;
    }
  }
  return groups;
}

function getVersion(file, depSelector, dep, confType) {
  const fileType = confType.split(".")[confType.split(".").length - 1];

  let data;
  if (fileType === "toml") data = toml.parse(file.join("\n"));
  else if (fileType === "json") data = JSON.parse(file.join("\n"));
  const verinfo = data[depSelector][dep];

  if (typeof verinfo === "string") return verinfo;
  return verinfo.version; // for Cargo.toml
}

function getPackageInfo(line, confType, file, depSelector) {
  const info = { name: undefined, version: undefined };

  const vals = line.match(nameParserRegex[confType]);
  if (vals === null || vals === undefined) return info;
  if (1 in vals) info["name"] = vals[1].trim();


  const ver = getVersion(file, depSelector, info["name"], confType);
  info.version = ver;

  return info;
}

module.exports = { getDepLines, getPackageInfo };
