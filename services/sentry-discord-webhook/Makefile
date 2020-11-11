-include .env

VERSION := $(shell git describe --tags 2> /dev/null || echo v0.0.0)
BUILD := $(shell git rev-parse --short HEAD)
PROJECTNAME := $(shell basename "$(PWD)")

# Go related variables.
# GOFILES := $(wildcard *.go)
GOFILES=main.go

# Use linker flags to provide version/build settings
LDFLAGS=-ldflags "-X=main.Version=$(VERSION) -X=main.Build=$(BUILD)"

# Make is verbose in Linux. Make it silent.
MAKEFLAGS += --silent

## build: Build the binary.
build:
	go build $(LDFLAGS) -o ./bin/$(PROJECTNAME) $(GOFILES)

## run: Run the application
run:
	go run $(LDFLAGS) $(GOFILES)

## test: Run unit tests
test:
	go test $(LDFLAGS) -race -covermode=atomic -coverprofile=coverage.out -v ./... 

## clean: Clean build files. Runs `go clean` internally.
clean:
	@-rm ./bin/$(PROJECTNAME) 2> /dev/null
	@echo "  >  Cleaning build cache"
	go clean

.PHONY: help
all: help
help: Makefile
	@echo
	@echo " Choose a command run in "$(PROJECTNAME)":"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo
