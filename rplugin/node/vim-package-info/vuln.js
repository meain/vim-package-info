const https = require("follow-redirects").https;

function getCoordinates(package, confType){
  switch (confType) {
    case "package.json":
      return `https://registry.npmjs.org/${package}`;
    case "Cargo.toml":
      return `https://crates.io/api/v1/crates/${package}`;
    case "requirements.txt":
    case "Pipfile":
      return `https://pypi.org/pypi/${package}/json`;
    default:
      return false;
  }
}
