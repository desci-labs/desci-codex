.PHONY: clean-test test

clean-test:
	rm -rf local-data/ceramic-test

test: clean-test
	sed 's|local-data/ceramic|local-data/ceramic-test|' composedb.config.json > test.config.json
	npx ceramic daemon --config test.config.json &>/dev/null &
	sleep 5
	node scripts/composites.mjs
	# Kill daemons without losing test exit code for CI
	if npm test; then \
		npm run kill; true; \
	else \
		npm run kill; false; \
	fi
