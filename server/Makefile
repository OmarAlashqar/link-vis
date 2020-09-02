all: build

build: src/*.go
	go build -o dist/main src/*.go

run:
	go run src/*.go

clean:
	rm -rf dist