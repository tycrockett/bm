## .zshrc, .bashrc, .bash_profile

```
bm () {
  if [[ $1 == "repos" ]] && [[ -n $2 ]] && [[ $2 != "rm" ]]
  then
    NEW_DIR=$(node ~/bm/bm repos $2)
    if [[ "$NEW_DIR" == "cd "* ]]
    then
      DIRECTORY=${NEW_DIR:3}
      cd $DIRECTORY
    fi;
  else
    node ~/bm/bm $@
  fi
}
```