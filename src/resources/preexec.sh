function init() {
  shopt -s extdebug

  preexec_invoke_exec () {
      [ -n "$COMP_LINE" ] && return  # do nothing if completing
      [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return # don't cause a preexec for $PROMPT_COMMAND
      local this_command=`HISTTIMEFORMAT= history 1 | sed -e "s/^[ ]*[0-9]*[ ]*//"`;

      # So that you don't get locked accidentally
      output="DOCKERFILE_BUILDER!RUN!$this_command!DOCKERFILE_BUILDER"
      echo $output | grep -o . | awk '{printf("%s\b", $0)}'
      if [ "shopt -u extdebug" == "$this_command" ]; then
          return 0
      fi

      # Modify $this_command and then execute it
      return 1 # This prevent executing of original command
  }
  trap 'preexec_invoke_exec' DEBUG
}

export -f init
