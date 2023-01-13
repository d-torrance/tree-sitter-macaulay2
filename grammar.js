module.exports = grammar({
  name: 'Macaulay2',

  rules: {
      source_file: $ => $.parse_tree,

      // ParseTree union from parse.d
      parse_tree: $ => choice(
	  $.token,
	  // $.adjacent,
	  // $.binary,
	  // $.unary,
	  // $.postfix
	  $.parentheses,
	  $.empty_parentheses,
	  $.if_then,
	  $.if_then_else,
	  $.quote,
	  $.global_quote,
	  $.thread_quote,
	  $.local_quote,
	  $.try_then_else,
	  $.try_else,
	  $.try,
	  $.catch,
	  $.while_do,
	  $.for,
	  $.while_list,
	  $.while_list_do,
	  // $.arrow, (we include this with binary)
	  $.new,
      ),

      binary: $ => choice($.binaryleft, $.binaryright),

      // TODO - how do we deal w/ precedence?
      binaryleft: $ => prec.left(seq(
	  field('lhs', $.parse_tree),
	  choice(
	      // unary binary left
	      '<<', '-', '+', '*', '#',
	      // binary left
	      '||', '|', '^^', '&', '..', '..<', '++', '**', '/', '%','//',
	      '@@', '^', '^**', '_', '#?', '.', '.?',
	      // nunary binary left
	      ','
	  ),
	  field('rhs', $.parse_tree))),

      binaryright: $ => prec.right(seq(
	  field('lhs', $.parse_tree),
	  choice(
	      // unary binary right
	      '|-', '<===', '<==', '<', '>', '<=', '>=', '?',
	      // nright
	      ';',
	      // binary right
	      ':=', '=', '<-', '->', '=>', '>>', '===>', '<==>', '==>', '===',
	      '==', '=!=', '!=', ':', '\\\\', '\\', '@', 'SPACE',
	      // binary right word
	      "or", "xor", "and"
	  ),
	  field('rhs', $.parse_tree))),

      empty_parentheses: $ => choice(
	  seq("[", "]"),
	  seq("<|", "|>"),
	  seq("(", ")"),
	  seq("{", "}")),

      parentheses: $ => choice(
	  seq("[", field('e', $.parse_tree), "]"),
	  seq("<|", field('e', $.parse_tree), "|>"),
	  seq("(", field('e', $.parse_tree), ")"),
	  seq("{", field('e', $.parse_tree), "}")),

      while_do: $ => prec(60, seq(
	  'while',
	  field('predicate', $.parse_tree),
	  'do',
	  field('do_clause', $.parse_tree))),

      while_list_do: $ => prec(61, seq(
	  'while',
	  field('predicate', $.parse_tree),
	  'list',
	  field('list_clause', $.parse_tree),
	  'do',
	  field('do_clause', $.parse_tree))),

      while_list: $ => prec(60, seq(
	  'while',
	  field('predicate', $.parse_tree),
	  'list',
	  field('predicate', $.parse_tree))),

      for: $ => prec.right(seq(
	  'for',
	  field('variable', $.parse_tree),
	  choice(
	      seq('in',
		  field('in_clause', $.parse_tree)),
	      seq(
		  optional(seq(
		      'from',
		      field('from_clause', $.parse_tree))),
		  optional(seq(
		      'to',
		      field('to_clause', $.parse_tree))))),
	  optional(seq(
	      'when',
	      field('when_clause', $.parse_tree))),
	  choice(
	      seq('do',
		  field('do_clause', $.parse_tree)),
	      seq('list',
		  field('list_clause', $.parse_tree),
		  optional(seq(
		      'do',
		      field('do_clause', $.parse_tree))))))),

      quote: $ => prec(60, seq(
	  'symbol',
	  field('rhs', $.parse_tree))),

      global_quote: $ => prec(60, seq(
	  'global',
	  field('rhs', $.parse_tree))),

      thread_quote: $ => prec(60, seq(
	  'threadVariable',
	  field('rhs', $.parse_tree))),

      local_quote: $ => prec(60, seq(
	  'local',
	  field('rhs', $.parse_tree))),

      if_then: $ => prec.right(60, seq(
	  'if',
	  field('predicate', $.parse_tree),
	  'then',
	  field('then_clause', $.parse_tree))),

      if_then_else: $ => prec(60, seq(
	  'if',
	  field('predicate', $.parse_tree),
	  'then',
	  field('then_clause', $.parse_tree),
	  'else',
	  field('else_clause', $.parse_tree))),

      try: $ => prec.right(60, seq(
	  'try',
	  field('primary', $.parse_tree))),

      try_else: $ => prec(60, seq(
	  'try',
	  field('primary', $.parse_tree),
	  'else',
	  field('else_clause', $.parse_tree))),

      try_then_else: $ => prec(60, seq(
	  'try',
	  field('primary', $.parse_tree),
	  'then',
	  field('then_clause', $.parse_tree),
	  'else',
	  field('else_clause', $.parse_tree))),

      catch: $ => seq(
	  'catch',
	  field('primary', $.parse_tree)),

      new: $ => prec.right(seq(
	  'new',
	  field('newclass', $.parse_tree),
	  optional(seq(
	      'of',
	      field('newparent', $.parse_tree))),
	  optional(seq(
	      'from',
	      field('newinitializer', $.parse_tree))))),

      token: $ => choice(
	  $.word
      ),

      // TODO: need to deal with other utf8 chars
      word: $ => /[a-zA-Z][a-zA-Z\d\']*/
  }
});
