docker image ls | grep docker-builder | sed 's/^[^ ]* *[^ ]* *\([^ ]*\) *.*/\1/' | xargs docker image rm
