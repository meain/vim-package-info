var semverUtils = require("semver-utils");

function colorizeDiff(current, latest, hl) {
  if (current) {
    let currentStripped = current.match(/(\d+\.)?(\d+\.)?(\*|\d+)/); // in case of stuff like '-beta' and things
    if (current) current = currentStripped[0];
    else current = null;
  }

  // stupid semver issue
  if (current && current != undefined)
    for (let i = current.split(".").length; i < 3; i++) current = current + ".0";
  if (latest && latest != undefined)
    for (let i = latest.split(".").length; i < 3; i++) latest = latest + ".0";

  let c = null;
  let l = null;

  if (current) c = semverUtils.parse(current);
  if (latest) l = semverUtils.parse(latest);

  let cd = [];
  if (c) cd = [[c.major, hl], [".", hl], [c.minor, hl], [".", hl], [c.patch, hl]];
  else cd = [["unavailable", hl]];

  if (l === null) return cd;

  cd = [...cd, [" ⇒ ", hl]];
  if (c !== null && parseInt(l.major) > parseInt(c.major)) {
    cd = [
      ...cd,
      [l.major, "VimPackageInfoMajor"],
      [".", hl],
      [l.minor, "VimPackageInfoMajor"],
      [".", hl],
      [l.patch, "VimPackageInfoMajor"],
    ];
  } else if (c !== null && parseInt(l.minor) > parseInt(c.minor)) {
    cd = [
      ...cd,
      [l.major, hl],
      [".", hl],
      [l.minor, "VimPackageInfoMinor"],
      [".", hl],
      [l.patch, "VimPackageInfoMinor"],
    ];
  } else if (c !== null && parseInt(l.patch) > parseInt(c.patch)) {
    cd = [
      ...cd,
      [l.major, hl],
      [".", hl],
      [l.minor, hl],
      [".", hl],
      [l.patch, "VimPackageInfoPatch"],
    ];
  } else {
    cd = [...cd, [l.major, hl], [".", hl], [l.minor, hl], [".", hl], [l.patch, hl]];
  }
  return cd;
}

module.exports = { colorizeDiff };
