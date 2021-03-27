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

# Install needed node packages
WORKDIR "/usr/src/docker-diary"

COPY ./package.json /usr/src/docker-diary/
COPY ./packages/console/package*.json /usr/src/docker-diary/packages/console/
COPY ./packages/lib/package*.json /usr/src/docker-diary/packages/lib/

RUN yarn install

# Copy over actual app
COPY tsconfig*.json /usr/src/docker-diary/
COPY packages/lib /usr/src/docker-diary/packages/lib
COPY packages/console /usr/src/docker-diary/packages/console
RUN yarn run build

## Start 'er up
WORKDIR "/opt/working-dir"
ENTRYPOINT ["node", "/usr/src/docker-diary/packages/console/build/src/index.js"]
