# FROM node:14-alpine

ARG BASE_VERSION=invalidVersion
FROM registry.gitlab.com/thomask33/fortify/base:$BASE_VERSION

ARG SERVICE_NAME

# Copy the files necessary for the serivce
WORKDIR /usr/src/app
COPY services/${SERVICE_NAME} ${SERVICE_NAME}

# Compile the service
WORKDIR /usr/src/app/${SERVICE_NAME}
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests

# Change file ownership inside of container
RUN chown -R node:node /usr/src/app
USER node

CMD scuttle npm run start
