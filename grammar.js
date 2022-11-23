module.exports = grammar({
  name: 'Macaulay2',

  rules: {
      source_file: $ => repeat($.expr),

      expr: $ => choice(
	  $.binary,
	  $.arrow,
	  $.empty_parentheses,
	  $.parentheses,
	  $.while_do,
	  $.while_list_do,
	  $.while_list,
	  $.for,
	  $.quote,
	  $.global_quote,
	  $.thread_quote,
	  $.local_quote,
	  $.if_then,
	  $.if_then_else,
	  $.try,
	  $.try_else,
	  $.try_then_else,
	  $.catch,
	  $.new,

	  // Token or Adjacent or Binary or Unary or Postfix or
	  // or dummy );

	  $.boolean
      ),

      // grammar based on parser.d
      binary: $ => choice($.binaryleft, $.binaryright),

      binaryleft: $ => prec.left(seq(
	  field('lhs', $.expr),
	  choice(
	      // unary binary left
	      '<<', '-', '+', '*', '#',
	      // binary left
	      '||', '|', '^^', '&', '..', '..<', '++', '**', '/', '%','//',
	      '@@', '^', '^**', '_', '#?', '.', '.?',
	      // nunary binary left
	      ','
	  ),
	  field('ret', $.expr))),

      binaryright: $ => prec.right(seq(
	  field('lhs', $.expr),
	  choice(
	      // unary binary right
	      '|-', '<===', '<==', '<', '>', '<=', '>=', '?',
	      // nright
	      ';'
	      // binary right
	      ':=', '=', '<-', '->', '=>', '>>', '===>', '<==>', '==>', '===',
	      '==', '=!=', '!=', ':', '\\\\', '\\', '@', 'SPACE',
	      // binary right word
	      "or", "xor", "and"
	  ),
	  field('ret', $.expr))),

      arrow: $ => prec.right(14, seq(
	  field('lhs', $.expr),
	  '->',
	  field('e', $.expr))),

      empty_parentheses: $ => choice(
	  seq("[", "]"),
	  seq("<|", "|>"),
	  seq("(", ")"),
	  seq("{", "}")),

      parentheses: $ => choice(
	  seq("[", field('e', $.expr), "]"),
	  seq("<|", field('e', $.expr), "|>"),
	  seq("(", field('e', $.expr), ")"),
	  seq("{", field('e', $.expr), "}")),

      while_do: $ => prec(60, seq(
	  'while',
	  field('predicate', $.expr),
	  'do',
	  field('do_clause', $.expr))),

      while_list_do: $ => prec(61, seq(
	  'while',
	  field('predicate', $.expr),
	  'list',
	  field('list_clause', $.expr),
	  'do',
	  field('do_clause', $.expr))),

      while_list: $ => prec(60, seq(
	  'while',
	  field('predicate', $.expr),
	  'list',
	  field('predicate', $.expr))),

      for: $ => prec.right(seq(
	  'for',
	  field('var', $.expr),
	  choice(
	      seq('in',
		  field('in_clause', $.expr)),
	      seq(
		  optional(seq(
		      'from',
		      field('from_clause', $.expr))),
		  optional(seq(
		      'to',
		      field('to_clause', $.expr))))),
	  optional(seq(
	      'when',
	      field('when_clause', $.expr))),
	  choice(
	      seq('do',
		  field('do_clause', $.expr)),
	      seq('list',
		  field('list_clause', $.expr),
		  optional(seq(
		      'do',
		      field('do_clause', $.expr))))))),

      quote: $ => prec(60, seq(
	  'symbol',
	  field('arg', $.expr))),

      global_quote: $ => prec(60, seq(
	  'global',
	  field('arg', $.expr))),

      thread_quote: $ => prec(60, seq(
	  'threadVariable',
	  field('arg', $.expr))),

      local_quote: $ => prec(60, seq(
	  'local',
	  field('arg', $.expr))),

      if_then: $ => prec.right(60, seq(
	  'if',
	  field('predicate', $.expr),
	  'then',
	  field('then_clause', $.expr))),

      if_then_else: $ => prec(60, seq(
	  'if',
	  field('predicate', $.expr),
	  'then',
	  field('then_clause', $.expr),
	  'else',
	  field('else_clause', $.expr))),

      try: $ => prec.right(60, seq(
	  'try',
	  field('primary', $.expr))),

      try_else: $ => prec(60, seq(
	  'try',
	  field('primary', $.expr),
	  'else',
	  field('else_clause', $.expr))),

      try_then_else: $ => prec(60, seq(
	  'try',
	  field('primary', $.expr),
	  'then',
	  field('then_clause', $.expr),
	  'else',
	  field('else_clause', $.expr))),

      catch: $ => prec(60, seq(
	  'catch',
	  field('primary', $.expr))),

      new: $ => prec.right(seq(
	  'new',
	  field('newclass', $.expr),
	  optional(seq(
	      'of',
	      field('newparent', $.expr))),
	  optional(seq(
	      'from',
	      field('newinitializer', $.expr))))),

      boolean: $ => choice('true', 'false')
  }
});
