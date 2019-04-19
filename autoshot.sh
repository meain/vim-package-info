rm -rf images && mkdir images
printf "|\n|\n|" >images/table.md
shoot() {
    echo $2
    (alacritty --position 100 20 -d 50 25 -e "$SHELL" -c "nvim $PWD/examples/$1 -c ':silent! /dependen' -c ':noh'") &
    PR_PID=$!
    sleep 50 # just wanna be liberal
    screencapture -R 100,263,450,505 "images/$2.png"

    kill -9 $PR_PID

    IMGUR_URL=$(~/.bin/imgurupload "images/$2.png" | head -n 1)
    L1=$(head -n 1 images/table.md)
    NL1="$L1![]($IMGUR_URL)|"

    MID=$(tail -n 2 images/table.md | head -n 1)

    L2=$(tail -n 1 images/table.md)
    NL2="$L2$2|"

    printf "$NL1\n$MID:---:|\n$NL2" >images/table.md
}

for file in $(ls examples); do
    shoot "$file" "$(basename $file)"
done
