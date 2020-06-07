FROM node:14-alpine
# ENV NODE_ENV production

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm ci --silent
COPY . .

RUN npm run build

RUN chown -R node:node /usr/src/app
USER node

EXPOSE 3000
CMD npm run start
