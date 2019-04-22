# vim-package-info  ![](https://travis-ci.org/meain/vim-package-info.svg?branch=master)

It lets you view the latest version of each package of your dependency.

**Currently supports `package.json`, `Cargo.toml` and `requirements.txt`**

| ![](https://i.imgur.com/YTaFHzs.png) | ![](https://i.imgur.com/HqgozdY.png) | ![](https://i.imgur.com/evCwnHZ.png) |
| :----------------------------------: | :----------------------------------: | :----------------------------------: |
|              Cargo.toml              |             package.json             |           requirements.txt           |

Default colors:

- `green`: patch update
- `cyan`: minor update
- `red`: major update

## Installation

> Make sure you have node support for neovim.
> Run the command `npm install -g neovim` to add it. [#20](https://github.com/meain/vim-package-info/issues/20)

Use your favorite plugin manager to install the plugin.
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


## Possible issues

The plugin might conflict with [ALE](https://github.com/w0rp/ale) or any other plugins that use `virtualtext`.
This is because `virtualtext` context is the same for all the plugins and if one clears the `virtualtext`
it will clear the `virutaltext` that was made by all plugins.

Not a lot can be done about this, but in the case of ALE you can checkout [#14](https://github.com/meain/vim-package-info/issues/14).

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
