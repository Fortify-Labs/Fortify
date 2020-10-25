FROM node:14-alpine
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

# ENV NODE_ENV production

# Copy the shared library
WORKDIR /usr/src/app
COPY services/shared shared

# Install all dependencies for the shared library and compile it
WORKDIR /usr/src/app/shared
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests
