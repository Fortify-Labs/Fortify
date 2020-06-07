FROM node:14-alpine
# ENV NODE_ENV production

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm ci --silent
COPY . .

RUN npm run compile &&\
	rm -rf src tests tslint.json tsconfig.json

RUN chown -R node:node /usr/src/app
USER node

EXPOSE 8080
CMD npm run start
