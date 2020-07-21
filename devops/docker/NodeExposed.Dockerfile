FROM node:14-alpine
# ENV NODE_ENV production

ARG SERVICE_NAME
ARG EXPOSED_PORT=8080

# Copy the files necessary for the serivce
WORKDIR /usr/src/app
COPY services/shared shared
COPY services/${SERVICE_NAME} ${SERVICE_NAME}

# Install all dependencies for the shared library and compile it
WORKDIR /usr/src/app/shared
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests

# Compile the service
WORKDIR /usr/src/app/${SERVICE_NAME}
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests

# Change file ownership inside of container
RUN chown -R node:node /usr/src/app
USER node

EXPOSE ${EXPOSED_PORT}
CMD npm run start