.PHONY: all
all: test_all.js

test_all.js: test.js bignum.js
	node_modules/.bin/webpack test.js $@
