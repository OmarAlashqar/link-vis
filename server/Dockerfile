FROM golang:alpine AS build

# golang environment vars
ENV GO111MODULE=on \
  CGO_ENABLED=0 \
  GOOS=linux \
  GOARCH=amd64

WORKDIR /build

# copy and download dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

# source code
COPY . .

# build the application
RUN go build -o dist/main src/*.go

# no longer need the Golang tooling, start with a smaller image
FROM scratch

# program environment variables
COPY .env.production .env

# SSL certificates since "scratch" has none
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# binary
COPY --from=build /build/dist/main /

EXPOSE 5000

# Run the binary
ENTRYPOINT ["/main"]