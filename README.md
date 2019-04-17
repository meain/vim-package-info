# vim-package-json

Simple things to enhance `package.json` content.

As of now, lets you view the latest version of each package in the file.

![image](https://i.imgur.com/grOUvbJ.png)

## Installation

Use your favorite plugin manager.

I use [vim-plug](https://github.com/junegunn/vim-plug).
```vim
Plug 'meain/vim-package-json', { 'do': 'npm install' }
```

## Configuration

#### Change prefix

```
let g:vim_package_json_virutaltext_prefix = '  ¤ '
```

### Change highlight group

```
let g:vim_package_json_virutaltext_highlight = 'NonText'
```

