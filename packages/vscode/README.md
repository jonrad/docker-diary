# Docker Diary

Keep track of the commands run in a container by saving them as a valid Dockerfile

![Demo](https://github.com/jonrad/docker-diary/blob/master/packages/vscode/media/demo.gif?raw=true)

## Warning

This is an alpha release of a tool I built for myself. It is not meant to be used to build real dockerfiles, but rather
to help iterate faster. You will still have to optimize the dockerfiles yourself.

## Installation

[Install Docker](https://docs.docker.com/install/) on your machine and add it to the system path.

On Linux, you should also [enable Docker CLI for the non-root user account](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user) that will be used to run VS Code.

## Features

* Ignores failing commands
* Settings working directory when directory has changed

## Requirements

* Base image must use bash as the default shell

## Extension Settings


## Known Issues

* Many

## Release Notes


### 0.0.1

* Initial release

