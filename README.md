# vim-package-info ![](https://travis-ci.org/meain/vim-package-info.svg?branch=master)

It lets you view the latest version of the packages you depend on and see if any of them are vulnerable.

> Vulnerability detection is still a work in progress ([disabled at the moment](https://ossindex.sonatype.org/doc/legacy-migration))

![](https://i.imgur.com/pzIrEkq.png)

**Currently supports:**
 * javascript:
   * `package.json`
 * rust:
   * `Cargo.toml`
 * python:
   * `requirements.txt`
   * `Pipfile`
   * `pyproject.toml`



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
