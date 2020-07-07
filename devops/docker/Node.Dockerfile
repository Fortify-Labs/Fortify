FROM node:14-alpine
# ENV NODE_ENV production

ARG SERVICE_NAME
ARG EXPOSED_PORT=8080

WORKDIR /usr/src/app
COPY services/shared shared
COPY services/${SERVICE_NAME} ${SERVICE_NAME}

WORKDIR /usr/src/app/${SERVICE_NAME}

RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests

RUN chown -R node:node /usr/src/app
USER node

EXPOSE ${EXPOSED_PORT}
CMD npm run start
