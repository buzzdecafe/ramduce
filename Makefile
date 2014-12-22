REPORTER = dot

test: test-xflag-dispatch
	@NODE_ENV=test ./node_modules/.bin/mocha \
    --reporter $(REPORTER) \

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--growl \
		--watch

test-transduce-compose: export TEST_TYPE=transduceCompose
test-transduce-compose:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \

test-xflag-dispatch: export TEST_TYPE=xflagDispatch
test-xflag-dispatch:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \

.PHONY: test test-w test-transduce-compose test-xflag-dispatch
