if !hlexists('VimPackageInfoPatch')
    highlight default VimPackageInfoPatch guifg=#8BC34A ctermfg=10
endif

if !hlexists('VimPackageInfoMinor')
    highlight default VimPackageInfoMinor guifg=#00BCD4 ctermfg=14
endif

if !hlexists('VimPackageInfoMajor')
    highlight default VimPackageInfoMajor guifg=#F44336 ctermfg=9
endif

if !hlexists('VimPackageInfoVulnerable')
    highlight default VimPackageInfoVulnerable guibg=#e85845 ctermbg=9 guifg=#222222 ctermfg=0
endif
