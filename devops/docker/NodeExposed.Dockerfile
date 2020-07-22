FROM node:14-alpine

# Below command makes scuttle available in path
COPY --from=redboxoss/scuttle:latest /scuttle /bin/scuttle
# ENV NODE_ENV production

ARG SERVICE_NAME
ARG EXPOSED_PORT=8080

# Copy the shared library
WORKDIR /usr/src/app
COPY services/shared shared

# Install all dependencies for the shared library and compile it
WORKDIR /usr/src/app/shared
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests

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

EXPOSE ${EXPOSED_PORT}
CMD scuttle npm run start
