if exists('b:vim_package_info_syntax')
  finish
endif

highlight default VimPackageInfoPatch guifg=green ctermfg=green
highlight default VimPackageInfoMinor guifg=cyan ctermfg=cyan
highlight default VimPackageInfoMajor guifg=red ctermfg=red

let b:vim_package_json_syntax = 'vim-package-info'
