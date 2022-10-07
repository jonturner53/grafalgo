/** @file Errors.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

export function warning(msg) {
	console.error(`Warning: ${msg}`);
}

export class Fatal extends Error {
  constructor(message) {
    super(message);
    this.name = 'Fatal';
  }
}

export function fatal(msg) { throw new Fatal(msg); }

export class AssertError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertError';
  }
}

/** Check assertion validity.
 *  Expected forms
 *  assert(bool) => a.equals(b)
 *  assert(bool, tag) => a.equals(b)
 *  assert(Boolean, Boolean, tag) => a == b
 *  assert(Number, Number, tag) => a == b
 *  assert(String, String, tag) => a == b
 *  assert(Adt, Adt, tag) => a.equals(b)
 *  assert(Adt, string, tag) => a.equals(b)
 *  assert(Adt, Adt, typ, typ, tag) => a.equals(b) && u == v
 *  assert(Adt, string, typ, typ, tag) => a.equals(b) && u == v

 *  @param success is a true/false value; if false, an AssertError is thrown.
 *  @param message is a string passed to the AssertError
 */
export function assert() {
	let args = arguments; let tag = args[args.length-1];
	if (args.length == 1) {
		if (!args[0]) throw new AssertError('');
	} else if (args.length == 2) {
		if (!args[0]) throw new AssertError(tag);
	} else if (args.length == 3 && (typeof args[0] == 'boolean' ||
									typeof args[0] == 'number'  ||
									typeof args[0] == 'string')) {
		if (args[0] != args[1])
			throw new AssertError(`${tag} ${args[0]} ${args[1]}`);
	} else if (args.length == 3) {
		if (!args[0].equals(args[1]))
			throw new AssertError(`${tag} ${args[0].toString()} ` +
										 `${args[1].toString()}`);
	} else if (args.length == 5) {
		if (!args[0].equals(args[1]) || args[2] != args[3])
			throw new AssertError(`${tag} ${args[0].toString()} ` +
										 `${args[1].toString()} ` +
										 `${args[2]} ${args[3]}`);
	} else {
		let s = "";
		for (let i = 0; i < args.length; i++) {
			if (i > 0) s += ', ';
			if (args[i] == null) s += 'null';
			else if (args[i]) s += args[i].toString();
		}
		throw new AssertError("invalid arguments " + s);
	}
}

export function fassert(condition, description) {
	if (!condition) throw new Fatal(description);
}
