ARG BASE_VERSION=invalidVersion
FROM ghcr.io/fortify-labs/fortify/base:$BASE_VERSION
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

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

CMD npm run start
