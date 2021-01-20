function ensureNumber(value) {
  const num = Number.parseInt(value || "0", 10);
  return Number.isNaN(num) ? 0 : num;
}

function normalize(version) {
  if (version) {
    const versionWithoutRange = version.replace(/[\^>=<]/g, "");
    const [versionWithoutBuild, buildText] = versionWithoutRange.trim().split("+", 2);
    const [versionWithoutRelease, releaseText] = versionWithoutBuild.split("-", 2);
    const [majorText, minorText, patchText] = versionWithoutRelease.split(".");
    const major = ensureNumber(majorText);
    const minor = ensureNumber(minorText);
    const patch = ensureNumber(patchText);
    const release = releaseText ? `-${releaseText}` : null;
    const build = buildText ? `+${buildText}` : null;
    const rest = (release || "") + (build || "");

    return { major, minor, patch, release, build, rest };
  }

  return null;
}

const diffLevel = {
  major: 3,
  minor: 2,
  patch: 1,
  none: 0,
};

function calculateDiff(c, l) {
  if (c && l) {
    if (l.major > c.major) {
      return diffLevel.major;
    } else if (l.major === c.major) {
      if (l.minor > c.minor) {
        return diffLevel.minor;
      } else if (l.minor === c.minor) {
        if (l.patch > c.patch) {
          return diffLevel.patch;
        }
      }
    }
  }

  return diffLevel.none;
}

function getHighlight(level, diff, hl) {
  if (diff >= level) {
    switch (diff) {
      case diffLevel.major:
        return "VimPackageInfoMajor";
      case diffLevel.minor:
        return "VimPackageInfoMinor";
      case diffLevel.patch:
        return "VimPackageInfoPatch";
    }
  }

  return hl;
}

function colorizeDiff(current, latest, hl) {
  const c = normalize(current);
  const l = normalize(latest);
  const diff = calculateDiff(c, l);
  let highlight = [];

  if (c) {
    highlight.push([`${c.major}.${c.minor}.${c.patch}${c.rest}`, hl]);
  } else {
    highlight.push(["unavailable", hl]);
  }

  highlight.push([" ⇒ ", hl]);
  highlight.push([l.major.toString(), getHighlight(diffLevel.major, diff, hl)]);
  highlight.push([".", hl]);
  highlight.push([l.minor.toString(), getHighlight(diffLevel.minor, diff, hl)]);
  highlight.push([".", hl]);
  highlight.push([l.patch.toString(), getHighlight(diffLevel.patch, diff, hl)]);

  if (l.rest) {
    highlight.push([l.rest.toString(), getHighlight(diffLevel.patch, diff, hl)]);
  }

  return highlight;
}

module.exports = { colorizeDiff };
