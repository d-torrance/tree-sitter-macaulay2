/**
 * @file Macaulay2 grammar for tree-sitter
 * @author Doug Torrance <dtorrance@piedmont.edu>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

import operator_info from './operator-info.json' with { type: 'json' };

const maybeChoice = (symbols) => {
  return symbols.length > 1 ? choice(...symbols) : symbols[0];
};

const binaryRules = operator_info.binary.map((group) => {
  return {
    group: group,
    rule: ($, lhs, rhs) => {
      const rule = seq(
        field('lhs', lhs),
        field('operator', maybeChoice(group.symbols)),
        field('rhs', rhs),
      );
      if (group.associativity == 'left') {
        return prec.left(group.precedence, rule);
      } else {
        return prec.right(group.precedence, rule);
      }
    },
  };
});

const unaryRules = operator_info.unary.map((group) => {
  return {
    group: group,
    rule: ($, rhs) =>
      prec.right(
        group.precedence,
        seq(field('operator', maybeChoice(group.symbols)), field('rhs', rhs)),
      ),
  };
});

const postfixRules = operator_info.postfix.map((group) => {
  return {
    group: group,
    rule: ($, lhs) =>
      prec.left(
        group.precedence,
        seq(field('lhs', lhs), field('operator', maybeChoice(group.symbols))),
      ),
  };
});

export default grammar({
  name: 'Macaulay2',

  externals: ($) => [$._space],

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => seq(repeat($.statement), optional($.expression)),

    statement: ($) => seq($.expression, choice(/\n+/, ';')),

    // Flat union of all expression forms — replaces parse_tree.
    // Intermediate tier rules (_strong_expr, _adj_expr) were tried but caused
    // a state explosion: hidden rule chains multiply LR items rather than
    // sharing them, and adding strong_binary/postfix to adjacent's LHS
    // created additional reduce-reduce conflicts on top of the original one.
    expression: ($) =>
      choice(
        $.token,
        $.adjacent,
        $.strong_binary,
        $.binary,
        $.unary,
        $.postfix,
        $.parentheses,
        $.if,
        $.quote,
        $.try,
        $.while,
        $.for,
        $.new,
      ),

    // Adjacent (function application by juxtaposition), prec 61, right-associative.
    //
    // The _space token is emitted by the external scanner (src/scanner.c) when
    // whitespace separates two expressions in an adjacent context.  Using an
    // explicit separator token means token → expression has exactly one
    // reduction path, eliminating the reduce-reduce conflict that caused the
    // 29,845-state explosion in the pure-LR approach.
    //
    // The scanner peeks at the character after whitespace and does NOT emit
    // _space for operator symbols or binary-only keywords (and, or, xor, do,
    // list, then, else, of, from, in, to, when, except), so x + y is never
    // misread as adjacent(x, unary(+, y)).
    adjacent: ($) =>
      prec.right(
        operator_info.adjacent,
        seq(field('lhs', $.expression), $._space, field('rhs', $.expression)),
      ),

    strong_binary: ($) =>
      choice(
        ...binaryRules
          .filter((group) => group.group.precedence > operator_info.adjacent)
          .map((group) => group.rule($, $.expression, $.expression)),
      ),

    binary: ($) =>
      choice(
        ...binaryRules
          .filter((group) => group.group.precedence < operator_info.adjacent)
          .map((group) => group.rule($, $.expression, $.expression)),
      ),

    unary: ($) => choice($.unary_binary, $.unary_only),

    unary_binary: ($) =>
      choice(
        ...unaryRules
          .filter((group) => group.group.binary)
          .map((group) => group.rule($, $.expression)),
      ),

    unary_only: ($) =>
      choice(
        ...unaryRules
          .filter((group) => !group.group.binary)
          .map((group) => group.rule($, $.expression)),
      ),

    postfix: ($) =>
      choice(...postfixRules.map((group) => group.rule($, $.expression))),

    // Inside brackets, ; is a sequence separator (not a statement terminator).
    // The RHS of the last ; may be absent, corresponding to M2's "dummy" token,
    // e.g. (foo;) evaluates foo and discards the result.
    semicolon_sequence: ($) =>
      seq($.expression, repeat1(seq(';', optional($.expression)))),

    parentheses: ($) =>
      choice(
        ...[
          ['[', ']'],
          ['<|', '|>'],
          ['(', ')'],
          ['{', '}'],
        ].map(([left, right]) => {
          return seq(
            field('left', left),
            optional(
              field('contents', choice($.semicolon_sequence, $.expression)),
            ),
            field('right', right),
          );
        }),
      ),

    while: ($) =>
      prec.right(
        seq(
          'while',
          field('predicate', $.expression),
          choice(
            seq('do', field('do_clause', $.expression)),
            seq(
              'list',
              field('list_clause', $.expression),
              optional(seq('do', field('do_clause', $.expression))),
            ),
          ),
        ),
      ),

    for: ($) =>
      prec.right(
        seq(
          'for',
          field('variable', $.identifier),
          choice(
            seq('in', field('in_clause', $.expression)),
            seq(
              optional(seq('from', field('from_clause', $.expression))),
              optional(seq('to', field('to_clause', $.expression))),
            ),
          ),
          optional(seq('when', field('when_clause', $.expression))),
          choice(
            seq('do', field('do_clause', $.expression)),
            seq(
              'list',
              field('list_clause', $.expression),
              optional(seq('do', field('do_clause', $.expression))),
            ),
          ),
        ),
      ),

    quote: ($) =>
      seq(
        choice('symbol', 'global', 'threadLocal', 'threadVariable', 'local'),
        field('rhs', $.identifier),
      ),

    if: ($) =>
      prec.right(
        seq(
          'if',
          field('predicate', $.expression),
          'then',
          field('then_clause', $.expression),
          optional(seq('else', field('else_clause', $.expression))),
        ),
      ),

    try: ($) =>
      prec.right(
        seq(
          'try',
          field('primary', $.expression),
          optional(seq('then', field('sequel', $.expression))),
          optional(
            choice(
              seq('else', field('alternate', $.expression)),
              seq(
                'except',
                field('variable', $.identifier),
                'do',
                field('do_clause', $.expression),
              ),
            ),
          ),
        ),
      ),

    new: ($) =>
      prec.right(
        seq(
          'new',
          field('newclass', $.expression),
          optional(seq('of', field('newparent', $.expression))),
          optional(seq('from', field('newinitializer', $.expression))),
        ),
      ),

    token: ($) =>
      choice(
        $.identifier, // TCid
        $.string, // TCstring
        $.integer, // TCint
        $.float, // TCRR
      ),

    // TODO: need to deal with other utf8 chars
    identifier: ($) => /[a-zA-Z][a-zA-Z\d\']*/,

    string: ($) =>
      choice(
        token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
        // TODO: deal w/ escaped slashes in ///-delineated strings
        // e.g., /// //// /// = " /// ", /// ///// = " /"
        // stretch goal: parse TEST and doc contents!
        token(seq('///', /[\s\S]*?/, '///')),
      ),

    integer: ($) =>
      token(choice(/\d+/, /0[bB][01]+/, /0[oO][0-7]+/, /0[xX][0-9a-fA-F]+/)),

    float: ($) => token(/(\d+(\.\d*)?|\.\d+)(p\d+)?([eE][+-]?\d+)?/),

    comment: ($) =>
      token(choice(seq('--', /[^\n]*/), seq('-*', /[\s\S]*?/, '*-'))),
  },
});
