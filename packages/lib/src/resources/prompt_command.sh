# i wonder if there are shell script minifiers...
function promptCommand() {
  if [ $? -eq 0 ]; then
    output=$(fc -ln -1| sed -e 's/^[ \t]*/DOCKER_DIARY!RUN!/' -e 's/ *$/!DOCKER_DIARY/')
    # It would be much easier to not use these backspaces and just use a \r. But that breaks some
    # terminals for long lines
    echo $output | grep -o . | awk '{printf("%s\b", $0)}'
  fi

  DOCKER_DIARY_PWD=$(pwd)
  if [ "$DOCKER_DIARY_PWD" != "$DOCKER_DIARY_PREVPWD" ]; then
    if [ -n "$DOCKER_DIARY_PREVPWD" ]; then
      output="DOCKER_DIARY!WORKDIR!${DOCKER_DIARY_PWD}!DOCKER_DIARY"
      echo $output | grep -o . | awk '{printf("%s\b", $0)}'
    fi

    export DOCKER_DIARY_PREVPWD=$DOCKER_DIARY_PWD
  fi
}

export -f promptCommand
