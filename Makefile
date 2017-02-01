.PHONY: build all

all: build

build:
	node_modules/.bin/rollup -o attr.js -f iife global.js
