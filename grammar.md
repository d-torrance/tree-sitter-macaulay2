# Macaulay2 Expression Grammar

EBNF description of the Macaulay2 expression grammar, organized as a
three-tier precedence hierarchy. This matches the structure of Macaulay2's
internal Pratt parser and is the basis for the tree-sitter grammar.

## Lexical Rules

```ebnf
identifier ::= [a-zA-Z] [a-zA-Z0-9']*

integer    ::= [0-9]+
             | ("0b" | "0B") [01]+
             | ("0o" | "0O") [0-7]+
             | ("0x" | "0X") [0-9a-fA-F]+

float      ::= ( [0-9]+ ("." [0-9]*)? | "." [0-9]+ )
               ("p" [0-9]+)? ([eE] [+-]? [0-9]+)?

string     ::= '"' ([^"\\] | "\\" .)* '"'
             | "///" .*? "///"    (* non-greedy *)

comment    ::= "--" [^\n]*
             | "-*" .*? "*-"      (* non-greedy *)
```

## Operator Tables

Each table is ordered from **highest to lowest precedence** (top to bottom).
Operators on the same row share the same precedence level.
The name in the first column is used as a reference label in the grammar rules below.

### Binary Operators

| Name                                 | Assoc | Operators                                                                                                                                                                                                                    |
| ------------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| element-access                       | left  | `#` `#?` `.` `.?` `^` `^**` `^<` `^<=` `^>` `^>=` `_` `_<` `_<=` `_>` `_>=` `\|_`                                                                                                                                            |
| composition                          | left  | `@@` `@@?`                                                                                                                                                                                                                   |
| _(adjacent — no symbol, see Tier 2)_ | right |                                                                                                                                                                                                                              |
| direct-sum                           | right | `@`                                                                                                                                                                                                                          |
| multiplicative                       | left  | `%` `*` `/` `//`                                                                                                                                                                                                             |
| quotient                             | right | `\` `\\`                                                                                                                                                                                                                     |
| tensor                               | left  | `**` `⊠` `⧢`                                                                                                                                                                                                                 |
| cdot                                 | left  | `·`                                                                                                                                                                                                                          |
| additive                             | left  | `+` `++` `-`                                                                                                                                                                                                                 |
| range                                | left  | `..` `..<`                                                                                                                                                                                                                   |
| intersection                         | left  | `&`                                                                                                                                                                                                                          |
| exterior-power                       | left  | `^^`                                                                                                                                                                                                                         |
| union                                | left  | `\|`                                                                                                                                                                                                                         |
| coercion                             | right | `:`                                                                                                                                                                                                                          |
| vertical-concatenation               | left  | `\|\|`                                                                                                                                                                                                                       |
| comparison                           | right | `!=` `<` `<=` `=!=` `==` `===` `>` `>=` `?`                                                                                                                                                                                  |
| and                                  | right | `and`                                                                                                                                                                                                                        |
| xor                                  | right | `xor`                                                                                                                                                                                                                        |
| or                                   | right | `??` `or`                                                                                                                                                                                                                    |
| implication                          | right | `<==` `==>`                                                                                                                                                                                                                  |
| biconditional                        | right | `<==>`                                                                                                                                                                                                                       |
| long-implication                     | right | `<===` `===>`                                                                                                                                                                                                                |
| entailment                           | right | `\|-`                                                                                                                                                                                                                        |
| output                               | left  | `<<`                                                                                                                                                                                                                         |
| assignment                           | right | `=` `:=` `->` `=>` `<-` `>>` `+=` `-=` `*=` `/=` `//=` `%=` `**=` `++=` `..=` `..<=` `<<=` `>>=` `??=` `@=` `@@=` `@@?=` `\=` `\\=` `^=` `^**=` `^^=` `_=` `\|-=` `\|=` `\|_=` `\|\|=` `<==>=` `===>=` `==>=` `·=` `⊠=` `⧢=` |
| sequence                             | left  | `,`                                                                                                                                                                                                                          |

The adjacent row marks the boundary between **strong** operators (above, prec > adjacent)
and **weak** operators (below, prec < adjacent).

### Postfix Operators

All postfix operators have higher precedence than adjacent.
Rows are ordered from highest to lowest precedence.

| Name          | Operators               |
| ------------- | ----------------------- |
| shriek        | `!` `^!` `_!`           |
| sheaf         | `^*` `^~` `_*` `_~` `~` |
| sum-of-twists | `(*)`                   |

### Unary Prefix Operators

Rows are ordered from highest to lowest precedence.
Operators marked with _(also binary)_ appear in both this table and the binary table;
context (whether a left operand is present) determines which role applies.

| Name                  | Operators                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| count                 | `#` _(also binary: element-access)_                                                                                                            |
| star                  | `*` _(also binary: multiplicative)_                                                                                                            |
| sign                  | `+` `-` _(also binary: additive)_                                                                                                              |
| comparison-test       | `<` `<=` `>` `>=` `?` _(also binary: comparison)_                                                                                              |
| not                   | `not`                                                                                                                                          |
| null-test             | `??` _(also binary: or)_                                                                                                                       |
| left-implication      | `<==` _(also binary: implication)_                                                                                                             |
| long-left-implication | `<===` _(also binary: long-implication)_                                                                                                       |
| deduction             | `\|-` _(also binary: entailment)_                                                                                                              |
| output                | `<<` _(also binary: output)_                                                                                                                   |
| control-flow          | `break` `breakpoint` `catch` `continue` `elapsedTime` `elapsedTiming` `profile` `return` `shield` `step` `TEST` `throw` `time` `timing` `trap` |
| comma                 | `,` _(also binary: sequence)_                                                                                                                  |

Note: `count` (`#`) sits at the same precedence level as adjacent.
It is unary prefix when no left operand is present; binary element-access (at a
higher level) when preceded by an expression.

## Grammar (Tiered EBNF)

The grammar has three tiers. An identifier reduces into exactly one type
(`strong_expr`) with no branching — the property that keeps the parse table small.

```ebnf
  token  →  strong_expr  →  adj_expr  →  expression
                ↑                ↑              ↑
         element-access      adjacent      weak binary /
         composition         (no symbol)   unary prefix /
         postfix ops                       if / try / while /
                                           for / new
```

### Top Level

```ebnf
source_file ::= statement* expression?

statement   ::= expression (newline+ | ";")
```

---

### Tier 1 — `strong_expr`

High-precedence operators: **element-access**, **composition**, and all
**postfix** operators. These bind more tightly than function application.

```ebnf
strong_expr ::= token
              | parentheses
              | quote
              | strong_expr strong_binary_op expression   (* element-access: left *)
                                                          (* composition:    left *)
              | strong_expr postfix_op                    (* shriek:         left *)
                                                          (* sheaf:          left *)
                                                          (* sum-of-twists:  left *)
```

The LHS of a strong binary expression is always `strong_expr` (atoms or other
strong expressions). The RHS is the full `expression` type, which allows
constructs like `x . if y then z` and `x # not y`.

```ebnf
strong_binary_op ::= (* element-access *)
                     "#" | "#?" | "." | ".?" | "^" | "^**"
                   | "^<" | "^<=" | "^>" | "^>="
                   | "_" | "_<" | "_<=" | "_>" | "_>=" | "|_"
                   | (* composition *)
                     "@@" | "@@?"

postfix_op ::= (* shriek *)        "!" | "^!" | "_!"
             | (* sheaf *)         "^*" | "^~" | "_*" | "_~" | "~"
             | (* sum-of-twists *) "(*)"
```

**Atoms** (the base cases of `strong_expr`):

```ebnf
token ::= identifier | string | integer | float

parentheses ::= "(" expression? ")"
              | "[" expression? "]"
              | "{" expression? "}"
              | "<|" expression? "|>"

quote ::= ("symbol" | "global" | "local" | "threadLocal" | "threadVariable")
          identifier
```

---

### Tier 2 — `adj_expr`

Adjacency (juxtaposition): function application written without an operator symbol.
Right-associative, so `f g x` = `f (g x)`.

```ebnf
adj_expr ::= strong_expr
           | strong_expr adj_rhs    (* adjacent: right-associative *)
```

The LHS of an adjacent expression is always `strong_expr`. The RHS is
restricted: **unary_binary** operators (those usable as both binary infix and
unary prefix, such as `+`, `-`, `*`, `<<`) are excluded, so `x + y` always
parses as `binary(+, x, y)` and never as `adjacent(x, unary(+, y))`.

```ebnf
adj_rhs ::= adj_expr           (* right-recursive; covers token, parens,
                                  quote, strong expressions, and nested adjacent *)
          | unary_only_expr    (* control-flow and "not" — keyword prefix *)
          | if_expr
          | try_expr
          | while_expr
          | for_expr
          | new_expr
```

```ebnf
unary_only_expr ::= unary_only_op expression

unary_only_op   ::= (* not *)          "not"
                  | (* control-flow *) "break" | "breakpoint" | "catch" | "continue"
                                     | "elapsedTime" | "elapsedTiming" | "profile"
                                     | "return" | "shield" | "step" | "TEST"
                                     | "throw" | "time" | "timing" | "trap"
```

---

### Tier 3 — `expression`

The general expression type (replaces `parse_tree` in Macaulay2's internal
representation). Contains all operators at or below adjacent precedence.

```ebnf
expression ::= adj_expr
             | expression weak_binary_op expression   (* see Binary Operators table *)
             | unary_prefix_op expression             (* see Unary Prefix table *)
             | unary_only_expr
             | if_expr
             | try_expr
             | while_expr
             | for_expr
             | new_expr
```

Each `weak_binary_op` has its own precedence and associativity as listed in
the Binary Operators table (the rows below **adjacent**). The EBNF above is
deliberately ambiguous about those relative precedences; the table governs.

```ebnf
weak_binary_op ::= (* direct-sum *)            "@"
                 | (* multiplicative *)        "%" | "*" | "/" | "//"
                 | (* quotient *)              "\" | "\\"
                 | (* tensor *)                "**" | "⊠" | "⧢"
                 | (* cdot *)                  "·"
                 | (* additive *)              "+" | "++" | "-"
                 | (* range *)                 ".." | "..<"
                 | (* intersection *)          "&"
                 | (* exterior-power *)        "^^"
                 | (* union *)                 "|"
                 | (* coercion *)              ":"
                 | (* vertical-concatenation *) "||"
                 | (* comparison *)            "!=" | "<" | "<=" | "=!=" | "==" | "===" | ">" | ">=" | "?"
                 | (* and *)                   "and"
                 | (* xor *)                   "xor"
                 | (* or *)                    "??" | "or"
                 | (* implication *)           "<==" | "==>"
                 | (* biconditional *)         "<==>"
                 | (* long-implication *)      "===>" | "<==="
                 | (* entailment *)            "|-"
                 | (* output *)                "<<"
                 | (* assignment *)            "=" | ":=" | "->" | "=>" | "<-" | ">>"
                                             | "+=" | "-=" | "*=" | "/=" | "//=" | "%="
                                             | "**=" | "++=" | "..=" | "..<==" | "<<=" | ">>="
                                             | "??=" | "@=" | "@@=" | "@@?=" | "\=" | "\\="
                                             | "^=" | "^**=" | "^^=" | "_=" | "|-=" | "|="
                                             | "|_=" | "||=" | "<==>="|  "===>="|  "==>="
                                             | "·=" | "⊠=" | "⧢="
                 | (* sequence *)             ","

unary_prefix_op ::= (* count *)               "#"
                  | (* star *)                "*"
                  | (* sign *)                "+" | "-"
                  | (* comparison-test *)     "<" | "<=" | ">" | ">=" | "?"
                  | (* null-test *)           "??"
                  | (* left-implication *)    "<=="
                  | (* long-left-implication *) "<==="
                  | (* deduction *)           "|-"
                  | (* output *)              "<<"
                  | (* comma *)               ","
```

**Keyword expressions:**

```ebnf
if_expr ::= "if" expression "then" expression ("else" expression)?

try_expr ::= "try" expression
             ("then" expression)?
             ( "else" expression
             | "except" identifier "do" expression )?

while_expr ::= "while" expression
               ( "do" expression
               | "list" expression ("do" expression)? )

for_expr ::= "for" identifier
             ( "in" expression
             | ("from" expression)? ("to" expression)? )
             ("when" expression)?
             ( "do" expression
             | "list" expression ("do" expression)? )

new_expr ::= "new" expression
             ("of" expression)?
             ("from" expression)?
```

## Notes

**Adjacent is right-associative**: `f g x` parses as `f (g x)`. This means
`g` is applied to `x` first, and the result is passed to `f`.

**`count` (`#`) sits at the adjacent level**: Unary `#` has the same precedence
as adjacent. It is always unary when no left operand precedes it; when preceded
by an expression, the `#` symbol triggers the higher-precedence
**element-access** binary form instead.

**Dual-use operators**: Many symbols appear in both the binary and unary prefix
tables (e.g., `+`, `-`, `*`, `<<`, `??`). The parser disambiguates by position:
the operator is binary when it appears between two expressions, and unary prefix
when it appears at the start of an expression (no left operand present).

**`unary_binary` excluded from `adj_rhs`**: Operators usable as both binary
infix and unary prefix (the dual-use ones, excluding `not` and the
control-flow keywords) are intentionally absent from the adjacent right-hand
side. This ensures `x + y` parses as `binary(+, x, y)` rather than
`adjacent(x, unary(+, y))`.

**Strong binary RHS is `expression`**: The right-hand side of element-access
and composition operators is the full `expression` type. This allows constructs
like `x . if y then z` (field access with a computed key) and `x # not y`.
Despite this permissiveness, lower-precedence constructs are not incorrectly
absorbed: in `x # f y`, the element-access operator (high precedence) reduces
before adjacent (lower precedence) can form, giving
`adjacent(strong_binary(#, x, f), y)`.
