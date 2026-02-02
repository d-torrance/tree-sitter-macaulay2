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
    rule: ($) => {
      const rule = seq(
        field('lhs', $.parse_tree),
        field('operator', maybeChoice(group.symbols)),
        field('rhs', $.parse_tree),
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
    rule: ($) =>
      prec.right(
        group.precedence,
        seq(
          field('operator', maybeChoice(group.symbols)),
          field('rhs', $.parse_tree),
        ),
      ),
  };
});

const postfixRules = operator_info.postfix.map((group) => {
  return {
    group: group,
    rule: ($) =>
      prec.left(
        group.precedence,
        seq(
          field('lhs', $.parse_tree),
          field('operator', maybeChoice(group.symbols)),
        ),
      ),
  };
});

export default grammar({
  name: 'Macaulay2',

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => seq(repeat($.statement), optional($.parse_tree)),

    statement: ($) => seq($.parse_tree, choice(/\n+/, ';')),

    // ParseTree union from parse.d (w/ some simplifications)
    parse_tree: ($) =>
      choice(
        $.token,
        $.adjacent,
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

    // TODO:
    // currently breaks tests on both lhs and rhs:
    // - binary
    // - postfix

    // NOTE:
    // due to precedence, the following will never be on the lhs:
    // - unary
    // - if
    // - try
    // - while
    // - for
    // - new
    // on the rhs:
    // - unary_binary

    adjacent: ($) =>
      prec.right(
        operator_info.adjacent,
        seq(
          field('lhs', choice($.token, $.parentheses, $.quote)),
          field(
            'rhs',
            choice(
              $.token,
              $.adjacent,
              $.parentheses,
              $.unary_only,
              $.if,
              $.quote,
              $.try,
              $.while,
              $.for,
              $.new,
            ),
          ),
        ),
      ),

    binary: ($) => choice(...binaryRules.map((group) => group.rule($))),

    unary: ($) => choice($.unary_binary, $.unary_only),

    unary_binary: ($) =>
      choice(
        ...unaryRules
          .filter((group) => group.group.binary)
          .map((group) => group.rule($)),
      ),

    unary_only: ($) =>
      choice(
        ...unaryRules
          .filter((group) => !group.group.binary)
          .map((group) => group.rule($)),
      ),

    postfix: ($) => choice(...postfixRules.map((group) => group.rule($))),

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
            optional(field('contents', $.parse_tree)),
            field('right', right),
          );
        }),
      ),

    while: ($) =>
      prec.right(
        seq(
          'while',
          field('predicate', $.parse_tree),
          choice(
            seq('do', field('do_clause', $.parse_tree)),
            seq(
              'list',
              field('list_clause', $.parse_tree),
              optional(seq('do', field('do_clause', $.parse_tree))),
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
            seq('in', field('in_clause', $.parse_tree)),
            seq(
              optional(seq('from', field('from_clause', $.parse_tree))),
              optional(seq('to', field('to_clause', $.parse_tree))),
            ),
          ),
          optional(seq('when', field('when_clause', $.parse_tree))),
          choice(
            seq('do', field('do_clause', $.parse_tree)),
            seq(
              'list',
              field('list_clause', $.parse_tree),
              optional(seq('do', field('do_clause', $.parse_tree))),
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
          field('predicate', $.parse_tree),
          'then',
          field('then_clause', $.parse_tree),
          optional(seq('else', field('else_clause', $.parse_tree))),
        ),
      ),

    try: ($) =>
      prec.right(
        seq(
          'try',
          field('primary', $.parse_tree),
          optional(seq('then', field('sequel', $.parse_tree))),
          optional(
            choice(
              seq('else', field('alternate', $.parse_tree)),
              seq(
                'except',
                field('variable', $.identifier),
                'do',
                field('do_clause', $.parse_tree),
              ),
            ),
          ),
        ),
      ),

    new: ($) =>
      prec.right(
        seq(
          'new',
          field('newclass', $.parse_tree),
          optional(seq('of', field('newparent', $.parse_tree))),
          optional(seq('from', field('newinitializer', $.parse_tree))),
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
