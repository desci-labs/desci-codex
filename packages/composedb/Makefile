.PHONY: generate clean clean-test start-test-env kill-test-env

generate:
	npm run generate

clean:
	rm -rf local-data

clean-test:
	rm -rf local-data/ceramic-test

start-test-env: clean-test generate
	if pgrep --older 1 --count --full "ceramic daemon|ipfs daemon"; then \
		echo "Refusing to clobber running daemons"; exit 1; \
	fi

	sed 's|local-data/ceramic|local-data/ceramic-test|' composedb.config.json \
		> test.config.json
	npx ceramic daemon --config test.config.json &>/dev/null &
	sleep 5

	npm run deployComposites

kill-test-env:
	npm run kill
