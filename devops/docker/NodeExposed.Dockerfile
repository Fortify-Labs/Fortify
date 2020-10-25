ARG BASE_VERSION=invalidVersion

FROM ghcr.io/fortify-labs/fortify/base:$BASE_VERSION AS builder
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

ARG SERVICE_NAME

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ARG SENTRY_ORG
ENV SENTRY_ORG=${SENTRY_ORG}

# Copy the files necessary for the serivce
WORKDIR /usr/src/app
COPY services/${SERVICE_NAME} ${SERVICE_NAME}

# Compile the service
WORKDIR /usr/src/app/${SERVICE_NAME}
RUN npm ci --silent
RUN npm run compile &&\
	npm run sentry &&\
	rm -rf src tests

# Multi stage build to reduce image size
FROM ghcr.io/fortify-labs/fortify/base:$BASE_VERSION
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

ARG SERVICE_NAME

WORKDIR /usr/src/app/${SERVICE_NAME}
COPY --from=builder /usr/src/app/${SERVICE_NAME}/build build
COPY --from=builder /usr/src/app/${SERVICE_NAME}/package.json .
COPY --from=builder /usr/src/app/${SERVICE_NAME}/package-lock.json .
COPY --from=builder /usr/src/app/${SERVICE_NAME}/tsconfig.json .

# Install only prod dependencies
RUN npm install --only=prod

# Change file ownership inside of container
RUN chown -R node:node /usr/src/app
USER node

# Expose port
ARG EXPOSED_PORT=8080
EXPOSE ${EXPOSED_PORT}

CMD npm run start
