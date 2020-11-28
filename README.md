# Dockerfile Builder
Build Dockerfiles interactively, using your shell

## Quick-Start

#### New Project No Dockerfile
```
cd /your/project/directory
docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/opt/working-dir jonrad/dockerfile-builder ubuntu
```

#### Existing Dockerfile
```
# Note, this is identical to starting a new project, except without passing the image arg
cd /your/project/directory
docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/opt/working-dir jonrad/dockerfile-builder
```

#### Options

```
docker run -it --rm \
  -v /var/run/docker.sock:/var/run/docker.sock `Required for dockerfile builder to communicate with docker` \
  -v $PWD:/opt/working-dir `Tells dockerfile builder where to put the Dockerfile and provides context` \
  jonrad/dockerfile-builder \
  ubuntu `The base image to use. Required if no Dockerfile exists in the working dir` \
  -f filter.txt `Optional file with commands to not store in the Dockerfile, using regex. Eg a file with the contents ^ls would filter out all lines starting with ls commands` \
```
