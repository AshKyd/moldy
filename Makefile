build:
	@make install
	@./node_modules/.bin/gulp

clean:
	@rm -rf node_modules dist

install:
	@npm install

release:
	@make clean
	@make build

.PHONY: build clean install release