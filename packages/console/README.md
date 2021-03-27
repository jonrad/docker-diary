# Docker Diary - Console Application

Keep track of the commands run in a container by saving them as a valid Dockerfile

## Quick-Start

#### Setup, No Install ####
```
# To make life easier
alias docker-diary="docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock -v \$PWD:/opt/working-dir jonrad/docker-diary"
```
#### New Project No Dockerfile
```
cd /your/project/directory
docker-diary --image ubuntu # Change ubuntu to your favorite base image
```

#### Existing Dockerfile
```
# Note, this is identical to starting a new project, except without passing the image arg
cd /your/project/directory
docker-diary
```

#### Options

```
docker-diary \
  --image ubuntu `The base image to use. Required if no Dockerfile exists in the working dir` \
  --dockerfile dockerfile `dockerfile if it's not the standard name. relative to /opt/working-dir` \
  --dry `dry run. Won't save changed to Dockerfile` \
  -- -v /foo:/bar -p 31337:31337 `any additional args to pass to docker` \
```

#### Development

##### Debugging
* Output what the shell is streaming for replaying:
```
docker-diary [options] | tee debug.txt
```

