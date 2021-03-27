FROM node:12

# Get needed packages
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common yarn

# Install docker cli
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian stretch stable"
RUN apt-get update -y
RUN apt-get install docker-ce-cli

# Copy over the app
COPY ./packages/vscode/package*.json /usr/src/docker-diary/packages/vscode/
COPY ./packages/lib/package*.json /usr/src/docker-diary/packages/lib/
COPY ./tsconfig*.json /usr/src/docker-diary/
COPY ./packages/lib /usr/src/docker-diary/packages/lib
COPY ./packages/vscode /usr/src/docker-diary/packages/vscode

# build the lib using npm :(
WORKDIR /usr/src/docker-diary/packages/lib
RUN npm install
RUN npm run build
RUN npm pack

WORKDIR /usr/src/docker-diary/packages/vscode
# install dependency to package the plugin
RUN npm install --save-dev vsce
# hack to get npm to work, replace the lib with a tarball
RUN npm install --save ../lib/docker-diary-lib-1.0.0.tgz
RUN npm run build
