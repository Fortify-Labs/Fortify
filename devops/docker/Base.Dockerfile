FROM node:14-alpine

# Below command makes scuttle available in path
# COPY --from=redboxoss/scuttle:latest /scuttle /bin/scuttle

# ENV NODE_ENV production

# Copy the shared library
WORKDIR /usr/src/app
COPY services/shared shared

# Install all dependencies for the shared library and compile it
WORKDIR /usr/src/app/shared
RUN npm ci --silent
RUN npm run compile &&\
	rm -rf src tests
