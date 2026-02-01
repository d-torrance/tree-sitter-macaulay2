const operator_info = require('./operator-info.json');

module.exports = grammar({
  name: 'Macaulay2',

  rules: {
    source_file: ($) => repeat($.statement),

    statement: ($) => seq($.parse_tree, optional(choice(/\n+/, ';'))),

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
        $.if_then,
        $.if_then_else,
        $.quote,
        $.global_quote,
        $.thread_quote,
        $.local_quote,
        $.try_do,
        $.try_then_do,
        $.try_then_else,
        $.try_then,
        $.try_else,
        $.try,
        $.catch,
        $.while_do,
        $.for,
        $.while_list,
        $.while_list_do,
        $.arrow,
        $.new,
      ),

    // TODO: more cases to consider, e.g.,
    // "x not y" => (adjacent (token x) (unary (token not) (token y)))
    adjacent: ($) =>
      prec.right(
        operator_info.adjacent,
        seq(
          field('lhs', choice($.token, $.parentheses, $.empty_parentheses)),
          field('rhs', choice($.token, $.parentheses, $.empty_parentheses)),
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

    unary: ($) =>
      choice(
        ...Object.entries(operator_info.unary).map(([op, p]) =>
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

    quote: ($) => seq('symbol', field('rhs', $.identifier)),

    global_quote: ($) => seq('global', field('rhs', $.identifier)),

    thread_quote: ($) =>
      seq(choice('threadLocal', 'threadVariable'), field('rhs', $.identifier)),

    local_quote: ($) => seq('local', field('rhs', $.identifier)),

    if_then: ($) =>
      seq(
        'if',
        field('predicate', $.parse_tree),
        'then',
        field('then_clause', $.parse_tree),
      ),

    if_then_else: ($) =>
      prec(
        1,
        seq(
          'if',
          field('predicate', $.parse_tree),
          'then',
          field('then_clause', $.parse_tree),
          'else',
          field('else_clause', $.parse_tree),
        ),
      ),

    try: ($) => seq('try', field('primary', $.parse_tree)),

    try_then: ($) =>
      prec(
        1,
        seq(
          'try',
          field('primary', $.parse_tree),
          'then',
          field('sequel', $.parse_tree),
        ),
      ),

    try_else: ($) =>
      prec(
        1,
        seq(
          'try',
          field('primary', $.parse_tree),
          'else',
          field('alternate', $.parse_tree),
        ),
      ),

    try_then_else: ($) =>
      prec(
        2,
        seq(
          'try',
          field('primary', $.parse_tree),
          'then',
          field('sequel', $.parse_tree),
          'else',
          field('alternate', $.parse_tree),
        ),
      ),

    try_do: ($) =>
      prec(
        1,
        seq(
          'try',
          field('primary', $.parse_tree),
          'except',
          field('variable', $.parse_tree),
          'do',
          field('do_clause', $.parse_tree),
        ),
      ),

    try_then_do: ($) =>
      prec(
        2,
        seq(
          'try',
          field('primary', $.parse_tree),
          'then',
          field('sequel', $.parse_tree),
          'except',
          field('variable', $.parse_tree),
          'do',
          field('do_clause', $.parse_tree),
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

    // TODO: ///-delimited strings
    string: ($) => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    integer: ($) =>
      token(choice(/\d+/, /0[bB][01]+/, /0[oO][0-7]+/, /0[xX][0-9a-fA-F]+/)),

    float: ($) => token(/(\d+(\.\d*)?|\.\d+)(p\d+)?([eE][+-]?\d+)?/),
  },
});
