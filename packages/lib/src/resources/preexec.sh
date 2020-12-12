function init() {
  shopt -s extdebug

  promptCommand () {
    DOCKER_BUILDER_PWD=$(pwd)
    output="DOCKERFILE_BUILDER!WORKDIR!${DOCKER_BUILDER_PWD}!DOCKERFILE_BUILDER"
    echo $output | grep -o . | awk '{printf("%s\b", $0)}'
  }

  preexec_invoke_exec () {
      [ -n "$COMP_LINE" ] && return  # do nothing if completing
      [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return # don't cause a preexec for $PROMPT_COMMAND
      local this_command=`HISTTIMEFORMAT= history 1 | sed -e "s/^[ ]*[0-9]*[ ]*//"`;

      if [ -n "$(echo $this_command | grep '^cd ')" ]; then
        PROMPT_COMMAND="promptCommand"
        return 0
      else
        # So that you don't get locked accidentally
        output="DOCKERFILE_BUILDER!RUN!$this_command!DOCKERFILE_BUILDER"
        echo $output | grep -o . | awk '{printf("%s\b", $0)}'
        if [ "shopt -u extdebug" == "$this_command" ]; then
            return 0
        fi

        # Modify $this_command and then execute it
        return 1 # This prevent executing of original command
      fi
  }
  trap 'preexec_invoke_exec' DEBUG
}

export -f init
