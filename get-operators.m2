needsPackage "JSON"

importFrom(Core, "getParsing")

keywords = unique select(values Core.Dictionary,
    x -> instance(x, Keyword) and not isMember(x, {
	    -- special keywords
	    symbol ->,
	    symbol ;,
	    symbol do,
	    symbol else,
	    symbol except,
	    symbol for,
	    symbol from,
	    symbol global,
	    symbol if,
	    symbol in,
	    symbol list,
	    symbol local,
	    symbol new,
	    symbol of,
	    symbol SPACE,
	    symbol symbol,
	    symbol then,
	    symbol threadLocal,
	    symbol to,
	    symbol try,
	    symbol when,
	    symbol while,
	    symbol (, symbol ),
	    symbol [, symbol ],
	    symbol {, symbol },
	    symbol <|, symbol |>
	}))

parsingInfo = hashTable apply(keywords, k -> (k, getParsing k))

operatorInfo = hashTable {
    ("adjacent", (getParsing symbol SPACE)#1),
    ("arrow", (getParsing symbol ->)#1),
    ("binary_right", hashTable apply(
	    select(keys parsingInfo, k -> (
		    parsingInfo#k#0 == parsingInfo#k#1 + 1)),
	    k -> (k, parsingInfo#k#1))),
    ("binary_left", hashTable apply(
	    select(keys parsingInfo, k -> (
		    parsingInfo#k#0 == parsingInfo#k#1)),
	    k -> (k, parsingInfo#k#1))),
    ("unary_binary", hashTable apply(
	    select(keys parsingInfo, k -> (
		    parsingInfo#k#1 != -1 and parsingInfo#k#2 != -1)),
	    k -> (k, parsingInfo#k#2))),
    ("unary_only", hashTable apply(
	    select(keys parsingInfo, k -> (
		    parsingInfo#k#1 == -1 and parsingInfo#k#2 != -1)),
	    k -> (k, parsingInfo#k#2))),
    ("postfix", hashTable apply(
	    select(keys parsingInfo, k -> (
		    parsingInfo#k#1 == -1 and parsingInfo#k#2 == -1)),
	    k -> (k, parsingInfo#k#0)))}

f = openOut "operator-info.json"
f << toJSON(operatorInfo, Indent => 2, Sort => true) << endl << close
