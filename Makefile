export PATH := $(PATH):./node_modules/.bin

all:
	tree-sitter generate

check:
	tree-sitter test
