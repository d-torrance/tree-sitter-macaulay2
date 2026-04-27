# Macaulay2 Expression Grammar

EBNF description of the Macaulay2 expression grammar. This matches the
semantics of Macaulay2's internal Pratt parser and can serve as a reference
for writing any Macaulay2 parser.

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

## Grammar

### Top Level

```ebnf
source_file ::= statement* expression?

statement   ::= expression (newline+ | ";")
```

---

### `expression`

The general expression type — a flat union of all forms. The **adjacent**
rule is what distinguishes M2's grammar from most other languages: function
application is written by juxtaposition, and it sits at a _middle_ precedence
level (between the high-precedence element-access/composition operators and
the low-precedence arithmetic/logical operators). Macaulay2's own parser
handles this with a Pratt parser; see the Adjacent section below for the
disambiguation rule.

```ebnf
expression ::= token
             | adjacent
             | strong_binary
             | binary
             | unary
             | postfix
             | parentheses
             | if_expr
             | quote
             | try_expr
             | while_expr
             | for_expr
             | new_expr
```

---

### Adjacent

Adjacency (juxtaposition): function application without an explicit operator
symbol. Right-associative, so `f g x` = `f (g x)`.

```ebnf
adjacent ::= expression expression   (* right-associative *)
```

Two expressions written next to each other — with any amount of whitespace
between them, including none — form an adjacent expression, provided the
character immediately following the whitespace is not an operator symbol or
a keyword that can only appear as an infix binary operator. This is the same
disambiguation rule used in Macaulay2's own Pratt parser, where adjacency is
encoded as a SPACE token with left-binding-power 61.

The rule for whether adjacency applies is determined by the first
non-whitespace character after the left expression:

| Next character                                 | Adjacent?                                                                                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Letter `[a-zA-Z]`                              | Yes, **unless** the full word is a binary-only keyword: `and`, `or`, `xor`, `do`, `list`, `then`, `else`, `of`, `from`, `in`, `to`, `when`, `except` |
| Digit `[0-9]`                                  | Yes                                                                                                                                                  |
| `"`                                            | Yes                                                                                                                                                  |
| `(`                                            | Yes, unless followed by `*)` (which is the postfix **sum-of-twists** operator)                                                                       |
| `[` or `{`                                     | Yes                                                                                                                                                  |
| Operator symbol, newline, `;`, closing bracket | No                                                                                                                                                   |

Whitespace is optional: `f(x)` and `QQ[x]` are adjacent expressions with no
space between the parts, equivalent to `f (x)` and `QQ [x]`.

---

### Strong Binary

High-precedence binary operators (**element-access** and **composition**
from the Binary Operators table). These bind more tightly than adjacent.

```ebnf
strong_binary ::= expression strong_binary_op expression   (* element-access: left *)
                                                           (* composition:    left *)

strong_binary_op ::= (* element-access *)
                     "#" | "#?" | "." | ".?" | "^" | "^**"
                   | "^<" | "^<=" | "^>" | "^>="
                   | "_" | "_<" | "_<=" | "_>" | "_>=" | "|_"
                   | (* composition *)
                     "@@" | "@@?"
```

---

### Binary

All binary operators with lower precedence than adjacent (the rows below
**adjacent** in the Binary Operators table).

```ebnf
binary ::= expression weak_binary_op expression   (* see Binary Operators table *)

weak_binary_op ::= (* direct-sum *)             "@"
                 | (* multiplicative *)         "%" | "*" | "/" | "//"
                 | (* quotient *)               "\" | "\\"
                 | (* tensor *)                 "**" | "⊠" | "⧢"
                 | (* cdot *)                   "·"
                 | (* additive *)               "+" | "++" | "-"
                 | (* range *)                  ".." | "..<"
                 | (* intersection *)           "&"
                 | (* exterior-power *)         "^^"
                 | (* union *)                  "|"
                 | (* coercion *)               ":"
                 | (* vertical-concatenation *) "||"
                 | (* comparison *)             "!=" | "<" | "<=" | "=!=" | "==" | "===" | ">" | ">=" | "?"
                 | (* and *)                    "and"
                 | (* xor *)                    "xor"
                 | (* or *)                     "??" | "or"
                 | (* implication *)            "<==" | "==>"
                 | (* biconditional *)          "<==>"
                 | (* long-implication *)       "===>" | "<==="
                 | (* entailment *)             "|-"
                 | (* output *)                 "<<"
                 | (* assignment *)             "=" | ":=" | "->" | "=>" | "<-" | ">>"
                                              | "+=" | "-=" | "*=" | "/=" | "//=" | "%="
                                              | "**=" | "++=" | "..=" | "..<==" | "<<=" | ">>="
                                              | "??=" | "@=" | "@@=" | "@@?=" | "\=" | "\\="
                                              | "^=" | "^**=" | "^^=" | "_=" | "|-=" | "|="
                                              | "|_=" | "||=" | "<==>="|  "===>="|  "==>="
                                              | "·=" | "⊠=" | "⧢="
                 | (* sequence *)              ","
```

Each operator has its own precedence and associativity as listed in the
Binary Operators table. The EBNF above is deliberately ambiguous about those
relative precedences; the table governs.

---

### Unary

```ebnf
unary ::= unary_prefix_op expression

unary_prefix_op ::= (* count *)                "#"
                  | (* star *)                 "*"
                  | (* sign *)                 "+" | "-"
                  | (* comparison-test *)      "<" | "<=" | ">" | ">=" | "?"
                  | (* not *)                  "not"
                  | (* null-test *)            "??"
                  | (* left-implication *)     "<=="
                  | (* long-left-implication *) "<==="
                  | (* deduction *)            "|-"
                  | (* output *)               "<<"
                  | (* control-flow *)         "break" | "breakpoint" | "catch" | "continue"
                                             | "elapsedTime" | "elapsedTiming" | "profile"
                                             | "return" | "shield" | "step" | "TEST"
                                             | "throw" | "time" | "timing" | "trap"
                  | (* comma *)               ","
```

---

### Postfix

```ebnf
postfix ::= expression postfix_op

postfix_op ::= (* shriek *)        "!" | "^!" | "_!"
             | (* sheaf *)         "^*" | "^~" | "_*" | "_~" | "~"
             | (* sum-of-twists *) "(*)"
```

---

### Atoms

```ebnf
token ::= identifier | string | integer | float

parentheses ::= "(" paren_contents? ")"
              | "[" paren_contents? "]"
              | "{" paren_contents? "}"
              | "<|" paren_contents? "|>"

paren_contents ::= expression
                 | semicolon_sequence

(* ; inside brackets is a sequence separator, not a statement terminator.
   The trailing expression after the last ; may be absent, corresponding to
   M2's "dummy" token: (foo;) evaluates foo and discards the result. *)
semicolon_sequence ::= expression (";" expression?)+

quote ::= ("symbol" | "global" | "local" | "threadLocal" | "threadVariable")
          identifier
```

---

### Keyword Expressions

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

**Adjacent works with or without whitespace**: `f x`, `f(x)`, and `QQ[x]`
are all adjacent expressions.

**`count` (`#`) sits at the adjacent level**: Unary `#` has the same precedence
as adjacent. It is always unary when no left operand precedes it; when preceded
by an expression, the `#` symbol triggers the higher-precedence
**element-access** binary form instead.

**Dual-use operators**: Many symbols appear in both the binary and unary prefix
tables (e.g., `+`, `-`, `*`, `<<`, `??`). The parser disambiguates by position:
the operator is binary when it appears between two expressions, and unary prefix
when it appears at the start of an expression (no left operand present).

**`x + y` is never adjacent**: The scanner does not emit `SPACE` before
operator symbols, so dual-use operators like `+`, `-`, `*`, `<<` in infix
position are always parsed as binary, never as the start of adjacent's RHS.

**Strong binary RHS is `expression`**: The right-hand side of element-access
and composition operators is the full `expression` type. This allows constructs
like `x . if y then z` and `x # not y`. Operator precedence prevents
lower-precedence constructs from being incorrectly absorbed: in `x # f y`,
element-access (higher precedence) reduces before adjacent (lower precedence)
can form, giving `adjacent(strong_binary(#, x, f), y)`.
