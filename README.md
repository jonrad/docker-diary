# Dockerfile Builder
Build Dockerfiles interactively, using your shell

## Quick-Start

#### Setup ####
```
# To make live easier
alias dockerfile-builder="docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$PWD:/opt/working-dir jonrad/dockerfile-builder"
```
#### New Project No Dockerfile
```
cd /your/project/directory
dockerfile-builder ubuntu #Change ubuntu to your favorite base image
```

#### Existing Dockerfile
```
# Note, this is identical to starting a new project, except without passing the image arg
cd /your/project/directory
dockerfile-builder
```

#### Options

```
dockerfile-builder
  ubuntu `The base image to use. Required if no Dockerfile exists in the working dir` \
  --filter filter.txt `Optional file with commands to not store in the Dockerfile, using regex. Eg a file with the contents ^ls would filter out all lines starting with ls commands` \
  --dockerfile dockerfile `Dockerfile if it's not the standard name. Relative to /opt/working-dir` \
  --dry `dry run. Won't save changed to Dockerfile`
```

#### Development

##### Debugging
* Output what the shell is streaming for replaying:
```
dockerfile-builder [options] | tee debug.txt
```

