# --- Build image ---
FROM golang:1.15.4-alpine AS build

RUN apk --no-cache add ca-certificates git make bash

WORKDIR /src/sentry-discord-webhook
COPY . .

ENV CGO_ENABLED=0
ENV GOOS=linux
RUN make

# --- Execution image ---
FROM scratch
LABEL org.opencontainers.image.source https://github.com/fortify-labs/fortify

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /src/sentry-discord-webhook/bin/sentry-discord-webhook /sentry-discord-webhook

CMD [ "/sentry-discord-webhook" ]
