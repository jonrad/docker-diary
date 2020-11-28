# i wonder if there are shell script minifiers...
function promptCommand() {
  if [ $? -eq 0 ]; then
    output=$(fc -ln -1| sed -e 's/^ */DOCKERFILE_BUILDER!RUN!/' -e 's/ *$/!DOCKERFILE_BUILDER/')
    # It would be much easier to not use these backspaces and just use a \r. But that breaks some
    # terminals for long lines
    echo $output | grep -o . | awk '{printf("%s\b", $0)}'
  fi

  DOCKER_BUILDER_PWD=$(pwd)
  if [ "$DOCKER_BUILDER_PWD" != "$DOCKER_BUILDER_PREVPWD" ]; then
    if [ -n "$DOCKER_BUILDER_PREVPWD" ]; then
      output="DOCKERFILE_BUILDER!WORKDIR!${DOCKER_BUILDER_PWD}!DOCKERFILE_BUILDER"
      echo $output | grep -o . | awk '{printf("%s\b", $0)}'
    fi

    export DOCKER_BUILDER_PREVPWD=$DOCKER_BUILDER_PWD
  fi
}

export -f promptCommand
