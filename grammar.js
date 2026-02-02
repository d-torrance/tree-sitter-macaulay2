/**
 * @file Macaulay2 grammar for tree-sitter
 * @author Doug Torrance <dtorrance@piedmont.edu>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

import operator_info from './operator-info.json' with { type: 'json' };

export default grammar({
  name: 'Macaulay2',

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => seq(repeat($.statement), optional($.parse_tree)),

    statement: ($) => seq($.parse_tree, choice(/\n+/, ';')),

    // ParseTree union from parse.d
    parse_tree: ($) =>
      choice(
        $.token,
        $.adjacent,
        $.binary,
        $.unary,
        $.postfix,
        $.parentheses,
        $.empty_parentheses,
        $.if,
        $.quote,
        $.try,
        $.catch,
        $.while_do,
        $.while_list,
        $.while_list_do,
        $.for,
        $.arrow,
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
    // - catch
    // - while
    // - for
    // - new
    // on the rhs:
    // - unary_binary
    // on the lhs or rhs:
    // - arrow

    adjacent: ($) =>
      prec.right(
        operator_info.adjacent,
        seq(
          field(
            'lhs',
            choice($.token, $.parentheses, $.empty_parentheses, $.quote),
          ),
          field(
            'rhs',
            choice(
              $.token,
              $.adjacent,
              $.parentheses,
              $.empty_parentheses,
              $.unary_only,
              $.if,
              $.quote,
              $.try,
              $.catch,
              $.while_do,
              $.while_list,
              $.while_list_do,
              $.for,
              $.new,
            ),
          ),
        ),
      ),

    arrow: ($) =>
      prec.right(
        operator_info.arrow,
        seq(field('lhs', $.parse_tree), '->', field('rhs', $.parse_tree)),
      ),

    binary: ($) => choice($.binary_left, $.binary_right),

    binary_left: ($) =>
      choice(
        ...Object.entries(operator_info.binary_left).map(([op, p]) =>
          prec.left(
            p,
            seq(
              field('lhs', $.parse_tree),
              field('operator', op),
              field('rhs', $.parse_tree),
            ),
          ),
        ),
      ),

    binary_right: ($) =>
      choice(
        ...Object.entries(operator_info.binary_right).map(([op, p]) =>
          prec.right(
            p,
            seq(
              field('lhs', $.parse_tree),
              field('operator', op),
              field('rhs', $.parse_tree),
            ),
          ),
        ),
      ),

    unary: ($) => choice($.unary_binary, $.unary_only),

    unary_binary: ($) =>
      choice(
        ...Object.entries(operator_info.unary_binary).map(([op, p]) =>
          prec.right(p, seq(field('operator', op), field('rhs', $.parse_tree))),
        ),
      ),

    unary_only: ($) =>
      choice(
        ...Object.entries(operator_info.unary_only).map(([op, p]) =>
          prec.right(p, seq(field('operator', op), field('rhs', $.parse_tree))),
        ),
      ),

    postfix: ($) =>
      choice(
        ...Object.entries(operator_info.postfix).map(([op, p]) =>
          prec.left(p, seq(field('lhs', $.parse_tree), field('operator', op))),
        ),
      ),

    empty_parentheses: ($) =>
      choice(
        seq(field('left', '['), field('right', ']')),
        seq(field('left', '<|'), field('right', '|>')),
        seq(field('left', '('), field('right', ')')),
        seq(field('left', '{'), field('right', '}')),
      ),

    parentheses: ($) =>
      choice(
        seq(
          field('left', '['),
          field('contents', $.parse_tree),
          field('right', ']'),
        ),
        seq(
          field('left', '<|'),
          field('contents', $.parse_tree),
          field('right', '|>'),
        ),
        seq(
          field('left', '('),
          field('contents', $.parse_tree),
          field('right', ')'),
        ),
        seq(
          field('left', '{'),
          field('contents', $.parse_tree),
          field('right', '}'),
        ),
      ),

    while_do: ($) =>
      seq(
        'while',
        field('predicate', $.parse_tree),
        'do',
        field('do_clause', $.parse_tree),
      ),

    while_list_do: ($) =>
      prec(
        1,
        seq(
          'while',
          field('predicate', $.parse_tree),
          'list',
          field('list_clause', $.parse_tree),
          'do',
          field('do_clause', $.parse_tree),
        ),
      ),

    while_list: ($) =>
      seq(
        'while',
        field('predicate', $.parse_tree),
        'list',
        field('predicate', $.parse_tree),
      ),

    for: ($) =>
      prec.right(
        seq(
          'for',
          field('variable', $.parse_tree),
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
                field('variable', $.parse_tree),
                'do',
                field('do_clause', $.parse_tree),
              ),
            ),
          ),
        ),
      ),

    catch: ($) => seq('catch', field('primary', $.parse_tree)),

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
