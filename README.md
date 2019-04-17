# vim-package-json

Simple things to enhance `package.json` content.

As of now, lets you view the latest version of each package in the file.

![image](https://i.imgur.com/5VDcOwE.png)

Default colors:

- `green`: patch update
- `cyan`: minor update
- `red`: major update

## Installation

Use your favorite plugin manager.

I use [vim-plug](https://github.com/junegunn/vim-plug).
```vim
Plug 'meain/vim-package-json', { 'do': 'npm install' }
```

----

Needs virtual text support. ( Neovim 0.3.2 )
> Check if `echo has('nvim-0.3.2')` returns 1

## Configuration

#### Change prefix

```
let g:vim_package_json_virutaltext_prefix = '  ¤ '
```

### Change highlight group

```
let g:vim_package_json_virutaltext_highlight = 'NonText'
```

There are three other highlight groups that you can change.
You can change them like this

```
hi VimPackageJsonPatch guifg=#8BC34A
hi VimPackageJsonMinor guifg=#00BCD4
hi VimPackageJsonMajor guifg=#F44336
```



