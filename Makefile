export PATH := $(PATH):./node_modules/.bin

all: ./node_modules/.bin/tree-sitter
	tree-sitter generate

check:
	tree-sitter test

./node_modules/.bin/tree-sitter:
	npm install
