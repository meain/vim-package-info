if exists('b:vim_package_json_syntax')
  finish
endif

highlight default VimPackageJsonPatch guifg=green ctermfg=green
highlight default VimPackageJsonMinor guifg=cyan ctermfg=cyan
highlight default VimPackageJsonMajor guifg=red ctermfg=red

let b:vim_package_json_syntax = 'vim-package-json'
