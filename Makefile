export PATH := $(PATH):./node_modules/.bin

all: ./node_modules/.bin/tree-sitter
	tree-sitter generate

check:
	rm -f test/corpus/*~
	tree-sitter test

./node_modules/.bin/tree-sitter:
	npm install

clean:
	rm -rf Cargo.toml binding.gyp bindings src

distclean: clean
	rm -rf node_modules package-lock.json

.PHONY: all check
