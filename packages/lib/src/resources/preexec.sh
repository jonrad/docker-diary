function init() {
  shopt -s extdebug

  promptCommand () {
    DOCKER_DIARY_PWD=$(pwd)
    output="DOCKER_DIARY!WORKDIR!${DOCKER_DIARY_PWD}!DOCKER_DIARY"
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
        output="DOCKER_DIARY!RUN!$this_command!DOCKER_DIARY"
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
