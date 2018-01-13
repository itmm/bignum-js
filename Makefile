.PHONY: all
all: test_all.js aes_all.js

test_all.js: test.js bignum.js
	node_modules/.bin/webpack test.js $@

aes_all.js: aes.js bignum.js
	node_modules/.bin/webpack aes.js $@
