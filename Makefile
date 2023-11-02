.PHONY: clean clean-test test

clean:
	rm -rf node_modules local-data

clean-test:
	rm -rf local-data/ceramic-test

test: clean-test
	if pgrep --ignore-ancestors --count --full "ceramic daemon|ipfs daemon"; then \
		echo "Refusing to clobber running daemons"; exit 1; \
	fi

	sed 's|local-data/ceramic|local-data/ceramic-test|' composedb.config.json \
		> test.config.json
	npx ceramic daemon --config test.config.json &>/dev/null &
	sleep 5

	npm run deployComposites
	# Ensure daemons dead, without losing test exit code for CI
	if npm test; then \
		npm run kill; true; \
	else \
		npm run kill; false; \
	fi
