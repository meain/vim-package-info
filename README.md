# vim-package-info

> Previously `vim-package-json`

It lets you view the latest version of each package of your dependency.

**Currently supports `package.json`, `Cargo.toml`** and `requirements.txt`

| ![](https://i.imgur.com/YTaFHzs.png) | ![](https://i.imgur.com/HqgozdY.png) | ![](https://i.imgur.com/evCwnHZ.png) |
| :----------------------------------: | :----------------------------------: | :----------------------------------: |
|              Cargo.toml              |             package.json             |           requirements.txt           |

Default colors:

- `green`: patch update
- `cyan`: minor update
- `red`: major update

## Installation

Use your favorite plugin manager.

I use [vim-plug](https://github.com/junegunn/vim-plug).

```vim
Plug 'meain/vim-package-info', { 'do': 'npm install' }
```

After installing the plugin, run `:UpdateRemotePlugins` to register it with Neovim.

---

Needs virtual text support. ( Neovim 0.3.2 )

> Check if `echo has('nvim-0.3.2')` returns 1

## Configuration

#### Change prefix

```
let g:vim_package_info_virutaltext_prefix = '  ¤ '
```

### Change highlight group

```
let g:vim_package_info_virutaltext_highlight = 'NonText'
```

There are three other highlight groups that you can change.
You can change them like this

```
hi VimPackageInfoPatch guifg=#8BC34A
hi VimPackageInfoMinor guifg=#00BCD4
hi VimPackageInfoMajor guifg=#F44336
```

## Development

### Adding a new config file type

It is more or less just adding a few regex templates and a some other stuff.
Here are a rough sketch of the steps.
Feel free to open an issue and ask if you need more help.

1. `parser.js > depMarkers` : specify start and end tokens for different groups
2. `parser.js > nameParserRegex` : regex to find the name from a line in the config
3. `parser.js > versionParserRegex` : regex to find the current version from a line in the config
4. `utils.js` : Add key to `global.vimnpmcache`
5. `utils.js > getUrl` : Add a url formatter
6. `utils.js > getLatestVersion` : Find latest version from the received data
