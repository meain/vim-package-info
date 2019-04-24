const tests = [
  {
    name: "package.json (Javascript)",
    file: "package.json",
    type: "json",
    tests: {
      url: {
        package: "mocha",
        url: "https://registry.npmjs.org/mocha",
      },
      dep_lines: {
        dependencies: [5, 13],
        devDependencies: [22, 27],
      },
      version_extraction: {
        data: { dependencies: { "babel-eslint": "^8.2.6", "why-did-you-update": "^0.1.1" } },
        checks: [
          {
            line: '    "babel-eslint": "^8.2.6",',
            depSelector: "dependencies",
            output: {
              name: "babel-eslint",
              version: "^8.2.6",
            },
          },
          {
            line: '    "why-did-you-update": "^0.1.1"',
            depSelector: "dependencies",
            output: {
              name: "why-did-you-update",
              version: "^0.1.1",
            },
          },
        ],
      },
    },
  },

  {
    name: "Cargo.toml (Rust)",
    file: "Cargo.toml",
    type: "toml",
    tests: {
      url: {
        package: "libc",
        url: "https://crates.io/api/v1/crates/libc",
      },
      dep_lines: {
        "build-dependencies": [18, 22],
        "dev-dependencies": [33, 36],
        dependencies: [22, 29],
      },
      version_extraction: {
        data: { dependencies: { libc: "8.2.6", serde: { version: "~1.0" } } },
        checks: [
          {
            line: 'libc = "8.2.6",',
            depSelector: "dependencies",
            output: {
              name: "libc",
              version: "8.2.6",
            },
          },
          {
            line: 'serde = { version = "~1.0",  features = ["derive"] }',
            depSelector: "dependencies",
            output: {
              name: "serde",
              version: "~1.0",
            },
          },
        ],
      },
    },
  },

  {
    name: "requirements.txt (Python)",
    file: "requirements.txt",
    type: "text",
    tests: {
      url: {
        package: "falcon",
        url: "https://pypi.org/pypi/falcon/json",
      },
      dep_lines: {
        null: [0, 24],
      },
      version_extraction: {
        data: null,
        checks: [
          {
            line: "falcon==1.4.1",
            depSelector: "null",
            output: {
              name: "falcon",
              version: "1.4.1",
            },
          },
          {
            line: "six==1.12.0 \\",
            depSelector: "null",
            output: {
              name: "six",
              version: "1.12.0",
            },
          },
          {
            line: "requests",
            depSelector: "null",
            output: {
              name: "requests",
              version: "",
            },
          },
        ],
      },
    },
  },

  {
    name: "Pipfile (Python)",
    file: "Pipfile",
    type: "toml",
    tests: {
      url: {
        package: "pylint",
        url: "https://pypi.org/pypi/pylint/json",
      },
      dep_lines: {
        packages: [10, 16],
        "dev-packages": [6, 10],
      },
      version_extraction: {
        data: { packages: { "tvdb-api": "2.0" }, "dev-packages": { pylint: "2.1.1" } },
        checks: [
          {
            line: 'tvdb-api = ">=2.0"',
            depSelector: "packages",
            output: {
              name: "tvdb-api",
              version: "2.0",
            },
          },
          {
            line: 'pylint = ">=2.1.1"',
            depSelector: "dev-packages",
            output: {
              name: "pylint",
              version: "2.1.1",
            },
          },
        ],
      },
    },
  },

  {
    name: "pyproject (Python)",
    file: "pyproject.toml",
    type: "toml",
    tests: {
      url: {
        package: "pylint",
        url: "https://pypi.org/pypi/pylint/json",
      },
      dep_lines: {
        "tool.poetry.dependencies": [5, 13],
        "tool.poetry.dev-dependencies": [13, 17],
      },
      version_extraction: {
        data: { packages: { "tvdb-api": "2.0" }, "dev-packages": { pylint: "2.1.1" } },
        checks: [
          {
            line: 'tvdb-api = ">=2.0"',
            depSelector: "packages",
            output: {
              name: "tvdb-api",
              version: "2.0",
            },
          },
          {
            line: 'pylint = ">=2.1.1"',
            depSelector: "dev-packages",
            output: {
              name: "pylint",
              version: "2.1.1",
            },
          },
        ],
      },
    },
  },
];

module.exports = { tests };
