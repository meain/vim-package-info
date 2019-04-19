// Format:
// [ [start, end], [start, end] ]
const depMarkers = {
  "package.json": [
    [/["|']dependencies["|']/, /\}/],
    [/["|']devDependencies["|']/, /\}/]
  ],
  "Cargo.toml": [[/\[.*dependencies\]/, /^ *\[.*\].*/]]
};
const nameParserRegex = {
  "package.json": /['|"]([a-zA-Z0-9-_])['|"] *:/,
  "Cargo.toml": /([a-zA-Z0-9-_]*) *=.*/
};
const versionParserRegex = {
  "package.json": /: *['|"]([a-zA-Z0-9-_.+~^*])['|"]/,
  "Cargo.toml": [
    /.*= *['|"]([a-zA-Z0-9-_.+~^*])['|"].*/,
    /[a-zA-Z0-9-_]* *= *{.*version *= *['|"]([a-zA-Z0-9-_.+~^*])['|"].*}/
  ]
};

function isStart(line, confType) {
  for (let i = 0; i < depMarkers[confType].length; i++) {
    const dm = depMarkers[confType][i];
    if (dm[0].test(line)) {
      return dm[1];
    }
  }
  return false;
}

function getDepLines(bf, confType) {
  let spos = -1;
  let epos = -1;
  let groups = [];
  for (let i = 0; i < bf.length; i++) {
    const end = isStart(bf[i], confType);
    if (end) {
      spos = i;
      for (let j = i + 1; j < bf.length; j++) {
        if (end.test(bf[j])) {
          epos = j;
          break;
        }
      }
      groups.push([spos + 1, epos + 1]);
      spos = -1;
      epos = -1;
    }
  }
  return groups;
}

function getPackageInfo(line, confType) {
  console.log("line", line);
  const info = { name: undefined, version: undefined };

  const re = nameParserRegex[confType];
  const vals = line.match(re);
  if (vals && 1 in vals) info["name"] = vals[1];

  console.log("info['name']", info["name"]);

  let vprs =
    versionParserRegex[confType] instanceof Array
      ? versionParserRegex[confType]
      : [versionParserRegex[confType]];

  for (let i = 0; i < vprs.length; i++) {
    const vals2 = line.match(vprs[i]);
    console.log("vals2", vals2);
    if (vals2 !== null && 1 in vals2) {
      info["version"] = vals2[1];
      break;
    }
  }

  return info;
}

module.exports = { getDepLines, getPackageInfo };
