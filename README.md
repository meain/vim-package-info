# vim-package-info

> Previously `vim-package-json`


It lets you view the latest version of each package of your dependency.

**Supports `package.json` and `Cargo.toml`**

![image](https://i.imgur.com/R5K3mC9.png)

Default colors:

- `green`: patch update
- `cyan`: minor update
- `red`: major update

## Installation

Use your favorite plugin manager.

I use [vim-plug](https://github.com/junegunn/vim-plug).

```vim
Plug 'meain/vim-package-info', { 'do': 'cd rplugin/node/vim-package-json && npm install' }
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
