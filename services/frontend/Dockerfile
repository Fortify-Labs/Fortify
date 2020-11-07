ARG BASE_VERSION=invalidVersion

FROM ghcr.io/fortify-labs/fortify/base:$BASE_VERSION
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

ARG SERVICE_NAME

# Copy the files necessary for the serivce
WORKDIR /usr/src/app/${SERVICE_NAME}
COPY services/${SERVICE_NAME} .

# Compile the service
RUN npm ci --silent &&\
	npm run compile &&\
	rm -rf src tests

# Install only prod dependencies
RUN npm install --only=prod

# Change file ownership inside of container
RUN chown -R node:node /usr/src/app
USER node

# Expose port
ARG EXPOSED_PORT=8080
EXPOSE ${EXPOSED_PORT}

CMD npm run start
