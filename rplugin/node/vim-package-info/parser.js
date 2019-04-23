const toml = require("toml");

// Format:
// [ [start, end], [start, end] ]
const depMarkers = {
  "package.json": [[/["|'](dependencies)["|']/, /\}/], [/["|'](devDependencies)["|']/, /\}/]],
  "Cargo.toml": [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]],
  "requirements.txt": null,
  Pipfile: [[/\[(packages)\]/, /^ *\[.*\].*/], [/\[(dev-packages)\]/, /^ *\[.*\].*/]],
};
const nameParserRegex = {
  "package.json": /['|"](.*)['|"] *:/,
  "Cargo.toml": /([a-zA-Z0-9\-_]*) *=.*/,
  "requirements.txt": /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/,
  Pipfile: /"?([a-zA-Z0-9\-_]*)"? *=.*/,
};

function isStart(line, confType) {
  // for requirements.txt
  if (depMarkers[confType] === null) return { depGroupName: null, end: null };

  for (let i = 0; i < depMarkers[confType].length; i++) {
    const dm = depMarkers[confType][i];
    const depGroup = line.match(dm[0]);
    if (depGroup !== undefined && depGroup !== null) {
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
    if (end === null) {
      groups[depGroupName] = [0, bf.length + 1];
      break;
    }
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

function getParsedFile(file, fileType) {
  let data;
  if (fileType === "toml") data = toml.parse(file);
  else if (fileType === "json") data = JSON.parse(file);
  else if (fileType === "text") data = file;
  return data;
}

function getVersion(data, depSelector, dep, line) {
  // will have to pass in line and parse from it
  // well it is string 'null' . Deal with it
  if (depSelector === "null") {
    if (line.indexOf("==") !== -1)
      return line
        .split("==")[1]
        .split("\\")[0]
        .trim();
    else return "";
  }

  const verinfo = data[depSelector][dep];

  if (typeof verinfo === "string") return verinfo;
  return verinfo.version; // for Cargo.toml
}

function getPackageInfo(line, confType, data, depSelector) {
  const info = { name: undefined, version: undefined };

  const vals = line.match(nameParserRegex[confType]);
  if (vals === null || vals === undefined) return info;
  if (1 in vals) info["name"] = vals[1].trim();

  const ver = getVersion(data, depSelector, info["name"], line);
  info.version = ver;

  return info;
}

module.exports = { getDepLines, getPackageInfo, getParsedFile };
