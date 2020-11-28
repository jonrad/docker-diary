function promptCommand() {
  if [ $? -eq 0 ]; then
    output=$(fc -ln -1| sed -e 's/^ */DOCKERFILE_BUILDER!RUN!/' -e 's/ *$/!DOCKERFILE_BUILDER/')
    echo -n $output && echo -en "\033[1K\r"
  fi

  DOCKER_BUILDER_PWD=$(pwd)
  if [ "$DOCKER_BUILDER_PWD" != "$DOCKER_BUILDER_PREVPWD" ]; then
    export DOCKER_BUILDER_PREVPWD=$DOCKER_BUILDER_PWD
    output="DOCKERFILE_BUILDER!WORKDIR!${DOCKER_BUILDER_PWD}!DOCKERFILE_BUILDER"
    echo -n $output && echo -en "\033[1K\r"
  fi
}

export -f promptCommand
