.PHONY: clean-test test

clean-test:
	rm -rf local-data/ceramic-test

test: clean-test
	sed 's|local-data/ceramic|local-data/ceramic-test|' composedb.config.json \
		> test.config.json
	npx ceramic daemon --config test.config.json &>/dev/null &
	sleep 5
	npm test; pkill --full "npm exec ceramic"