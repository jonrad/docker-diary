FROM node:12

# Get needed packages
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

# Install docker cli
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian stretch stable"
RUN apt-get update -y
RUN apt-get install docker-ce-cli

## Install needed node packages
WORKDIR "/usr/src/docker-builder"
COPY ./package*.json /usr/src/docker-builder/
RUN npm install

# Copy over actual app
COPY ./build/src/ /usr/src/docker-builder/

# Start 'er up
WORKDIR "/opt/working-dir"
ENTRYPOINT ["node", "/usr/src/docker-builder/index.js"]
WORKDIR /opt
RUN pwd
RUN echo hello1
