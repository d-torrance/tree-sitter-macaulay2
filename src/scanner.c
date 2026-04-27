#include <string.h>
#include <tree_sitter/parser.h>

enum TokenType {
    SPACE,
};

// Keywords that cannot start an expression without a left operand.
// The scanner will not emit SPACE when the next word is one of these,
// preventing e.g. "f and x" from being misread as adjacent(f, ???).
static const char *BINARY_KEYWORDS[] = {
    "and", "or", "xor",
    "do", "list",
    "then", "else",
    "of", "from", "in", "to", "when", "except",
    NULL,
};

static bool is_binary_keyword(const char *word, unsigned len) {
    for (int i = 0; BINARY_KEYWORDS[i] != NULL; i++) {
        const char *kw = BINARY_KEYWORDS[i];
        if (len == strlen(kw) && strncmp(word, kw, len) == 0) {
            return true;
        }
    }
    return false;
}

void *tree_sitter_Macaulay2_external_scanner_create() { return NULL; }
void tree_sitter_Macaulay2_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_Macaulay2_external_scanner_serialize(void *payload,
                                                           char *buffer) {
    return 0;
}
void tree_sitter_Macaulay2_external_scanner_deserialize(void *payload,
                                                         const char *buffer,
                                                         unsigned length) {}

bool tree_sitter_Macaulay2_external_scanner_scan(void *payload, TSLexer *lexer,
                                                  const bool *valid_symbols) {
    if (!valid_symbols[SPACE]) return false;

    // Consume any non-newline whitespace — possibly zero characters.
    // This allows zero-width adjacency like QQ[x] (no space between QQ and [x]).
    int32_t c = lexer->lookahead;
    while (c == ' ' || c == '\t' || c == '\r') {
        lexer->advance(lexer, false);
        c = lexer->lookahead;
    }
    // Mark token end here. Subsequent advances are lookahead only: if we
    // return true the next token re-scans from this position.
    lexer->mark_end(lexer);

    // Newline or semicolon: statement boundary, no adjacency.
    if (c == '\n' || c == ';' || c == 0) return false;

    // Closing brackets: end of an enclosing parenthesized expression.
    if (c == ')' || c == ']' || c == '}') return false;

    // Digit: starts a number literal.
    if (c >= '0' && c <= '9') {
        lexer->result_symbol = SPACE;
        return true;
    }

    // Double-quote: starts a string literal.
    if (c == '"') {
        lexer->result_symbol = SPACE;
        return true;
    }

    // '[' and '{' always start a bracket expression.
    if (c == '[' || c == '{') {
        lexer->result_symbol = SPACE;
        return true;
    }

    // '(' starts a bracket expression, UNLESS the full token is the postfix
    // operator '(*)' — in that case do not emit _space.
    if (c == '(') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '*') {
            lexer->advance(lexer, false);
            if (lexer->lookahead == ')') {
                return false; // '(*)' postfix — let the regular lexer handle it
            }
        }
        // Regular '(' bracket: next scan restarts from mark_end (before '(').
        lexer->result_symbol = SPACE;
        return true;
    }

    // Letter: start of an identifier or keyword.
    // Read the whole word to distinguish binary-only keywords.
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
        char word[64];
        unsigned len = 0;
        while ((lexer->lookahead >= 'a' && lexer->lookahead <= 'z') ||
               (lexer->lookahead >= 'A' && lexer->lookahead <= 'Z') ||
               (lexer->lookahead >= '0' && lexer->lookahead <= '9') ||
               lexer->lookahead == '\'') {
            if (len < sizeof(word) - 1) {
                word[len++] = (char)lexer->lookahead;
            }
            lexer->advance(lexer, false);
        }
        word[len] = '\0';

        if (is_binary_keyword(word, len)) return false;

        lexer->result_symbol = SPACE;
        return true;
    }

    // Anything else (operator symbols, etc.): not an adjacent context.
    return false;
}
