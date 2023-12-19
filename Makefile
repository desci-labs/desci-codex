.PHONY: clean clean-test test test-stop

clean:
	rm -rf node_modules
	$(MAKE) -C packages/composedb clean

clean-test:
	$(MAKE) -C packages/composedb clean-test

test: clean-test
	$(MAKE) -C packages/composedb start-test-env
	# Ensure daemons dead, without losing test exit code for CI
	if npm run test --workspace packages/lib; then \
		$(MAKE) -C packages/composedb kill-test-env; true; \
	else \
		$(MAKE) -C packages/composedb kill-test-env; false; \
	fi

test-stop:
	$(MAKE) -C packages/composedb kill-test-env;
