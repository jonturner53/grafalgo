/** @file Top.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled as ae} from '../common/Assert.mjs';

/** The Top class is the super-class from which other classes
 *  in grafalgo are derived.
 *
 *  The data structures in grafalgo are built using integer index values
 *  to refer to specific items (set elements, list items, vertices in graphs).
 *  In this context, an index is a positive integer in a bounded range 0..n,
 *  for some value of n (0 is used as null).
 *
 *  The use of index values has a couple advantages over pointers.
 *  First, index values can serve as common "handles" for
 *  items in multiple data structures, eliminating the need to have
 *  explicit mappings to relate such items. As one example,
 *  in an algorithm that uses a graph and a separate list of vertices,
 *  both can use the same indexes to represent the vertices.
 *  Index values also make it trivial to have fast membership tests
 *  for index lists and similar data structures.
 */
export default class Top {
	n_;		// index values in 1..n_

	constructor(n=10, property=[]) {
		this.n_ = Math.max(1,n);

		// placeholders for optional properties
		// properties_[i] is [name,default] pair for i-th property
		// property_values_[i] is array of i-th property's values
		this.properties_ = [];
		this.property_values_ = [];

		if (property[0]) this.addProperty(property);
	}

	/** Get the index range for the object.
	 *  @return the largest index value
	 */
	get n() { return this.n_; }

	/** Determine if a given index is valid.
	 *  @param i is an integer
	 *  @return true if i lies within the allowed range of index values,
	 *  else false
	 */
	valid(i) {
		ae() && assert(i == ~~i);
		return 0 <= i && i <= this.n;
	}

	toString() {
		throw `Top: sub-class ${this.constructor.name} failed to ` +
			  `define toString method.`;
	}
	
	/** Convert an index to a alphabetic character.
	 *  @param x is an integer >=0
	 *  @param upper is a flag specifying upper case characters instead
	 *  of lower case
	 *  @return 'a' (or 'A') for 1, etc, if 1<=x<=26; if x==0 return '-';
	 *  if x>26 return ''+x
	 */
	index2char(x, upper=0) {
		let s = upper ? '-ABCDEFGHIJKLMNOPQRSTUVWXYZ' :
						'-abcdefghijklmnopqrstuvwxyz';
		return (x <= 26 ? s[x] : ''+x);
	}
	x2c(...args) { return this.index2char(...args); }

	/** Convert an index to a string.
	 *  @param x is a valid index for the data structure
	 *	@param label is an optional function
	 *  @param upper is a flag specifying upper case characters
	 *  @return label(x) if typeof label=='function';
	 *  if label==0, the returned string is index2char(x,upper);
	 *  if label==1 or is omitted, the returned value includes x's
	 *  first property (if one exists)
	 *  that property values equal to the default value are suppressed
	 */
	index2string(x,label=1,upper=0) {
		if (typeof label == 'function') return label(x);
		let s = this.index2char(x,upper);
		let [pname] = this.property(0);
		if (label == 0 || !pname || !x) return s;
		return s + ':' + Top.datum2string(this[pname](x)); 
	}
	x2s(...args) { return this.index2string(...args); }

	/** Convert a list of index values to a string.
	 *  @param ilist is an array of valid index values
	 *	@param label is an optional function used to produce string from value
	 *  @return a string that represents the list.
	 */
	ilist2string(ilist, label=1) {
		let s = '';
		for (let i of ilist) {
			if (s.length > 0) s += ' ';
			s += this.x2s(i, label);
		}
		return '[' + s + ']';
	}

	/** Convert a list of numeric values to a string.
	 *  @param nlist is an array of numbers
	 *  @return a string that represents the list.
	 */
	static nlist2string(nlist) {
		let s = '';
		for (let i of nlist) {
			if (s.length > 0) s += ' ';
			s += i;
		}
		return '[' + s + ']';
	}

	/** Return a string representation of a value.
	 *  @param v is a string, number or object
	 *  @return a string representing the value
	 */
	static datum2string(v) {
		if (typeof v == 'string') return '"' + v + '"';
		if (typeof v == 'object') return JSON.stringify(v);
		return ''+v;
	}
	static d2s(v) { return Top.datum2string(v); }

	// Methods to associate named properties with index values.
	// Property values may be numbers, booleans, strings or simple objects
	// (meaning no embedded objects).

	properties_;     // properties_[i] is [name,default] pair for i-th property
	property_values_ // property_values_[i] is array of i-th property's values

	/** Create a shallow copy of a data value and return it.
	 *  @param a is of type boolean, number, string or object; if it is
	 *  an object, assumed to be simple.
	 */
	static simpleCopyof(p) {
		let rv = typeof p != 'object' ? p :
				(Array.isArray(p) ? [...p] : {...p});
		return rv;
	}

	/** Equality comparison for primitive types and simple objects.
	 *  @param a is a boolean, number, string or object
	 *  @param b is a boolean, number, string or object of matching type
	 *  @return true on strict equality for primitive types; for objects,
	 *  keys must match and values must be primitive and strictly equal
	 */
	static simpleEquals(a,b) {
		if (typeof a != 'object') return a === b;
		if (typeof b != 'object') return false;
		if (Array.isArray(a) != Array.isArray(b)) return false;
		let kva = Object.entries(a); let kvb = Object.entries(b);
		if (kva.length != kvb.length) return false;
		for (let i = 0; i < kva.length; i++) {
			let [ka,va] = kva[i]; let [kb,vb] = kvb[i];
			if (ka != kb || typeof va == 'object' || typeof vb == 'object')
				return false;
			if (va !== vb) return false;
		}
		return true;
	}

	/** Add a new property.
	 *  @param property is a pair [pname,pdefault] where pname is the name of
	 *  the new property and pdefault is its default value
	 */
	addProperty(property) {
		let [pname, pdefault] = property;
		ae && assert(pname) &&
			  assert(this[pname] == undefined,
			  		 'ListSet:addProperty: name clash for ' + pname);

		this.properties_.push([pname,Top.simpleCopyof(pdefault)]);
		let values = new Array(this.n+1);
		for (let j = 1; j <= this.n+1; j++)
			values[j] = Top.simpleCopyof(pdefault);
		this.property_values_.push(values);

		let i = this.properties_.length-1;
		let cname = this.constructor.name;

		Object.defineProperty(this, pname,
			{ value: 	function(x,v) {
							ae() && assert(0 <= x && x <= this.n,
                     			cname + `.${pname}: invalid argument: ${x}`);
							if (v != undefined) {
								this.property_values_[i][x] =
											Top.simpleCopyof(v);
							}
							return Top.simpleCopyof(
											this.property_values_[i][x]);
						}
			});
		Object.defineProperty(this, 'reset_' + pname,
			{ value: function(v) {
						if (v == undefined) v = this.properties_[i][1];
						for (let j = 1; j <= this.n; j++)
							this[pname](j, v);
				 	  }
			});
	}

	/** Retrieve a property name and default value using index.
	 *  @param i is a non-negative integer identifying a property, in the
	 *  order the properties were added; so 0 is the first property added
	 *  @return pair [name,default] giving the name and default value of
	 *  the property, or [] if there is no property i
	 */
	property(i) {
		if (i >= this.properties_.length) return [];
		let [pname,pdefault] = this.properties_[i];
		return [pname, Top.simpleCopyof(pdefault)];
	}

	/** Clear property values */
	clear() {
		for (let i = 0; i < this.properties_.length; i++) {
			let [pname] = this.properties_[i];
			this['reset_'+pname]();
		}
	}

	/** Compare property values of two objects
	 *  @param p is an object
	 *  @param q is a second object
	 *  @param name is the name of a property of the items in both p and q
	 *  @return true if p[name] = q[name] for all items in the index range
	 */
	static equalPropertyValues(p, q, name) {
		if (!p[name] || !q[name] || p.n != q.n) return false;
		for (let i = 1; i <= p.n; i++) {
			if (!Top.simpleEquals(p[name](i), q[name](i))) return false;
		}
		return true;
	}

	/** Determine if two objects are equal.
	 *  Static method allows objects q are not immediate descendants
	 *  of Top in the class hierarchy to get the default processing
	 *  of common cases, without going through intervening classes.
	 *  Uses string comparison for objects q lack a fromString method.
	 *  The comparison of the two objects includes the values of the first
	 *  property (if present) but no others.
	 *  @param q is an object to be compared to p, or a string
	 *  representation of such an object
	 *  @param args is an optional array of arguments to be passed
	 *  to p.constructor.fromString when q is a string
	 *  @returns true or false if equality status can be determined
	 *  without an explicit object comparison; otherwise either q or
	 *  if q is a string, the object returned by
	 *  fromString(q, p.n, this.property(0), ...args)
	 */
	static equals(p, q, ...args) {
		if (p === q) return true;
		if (typeof q == 'string') {
			let s = q;
			if (typeof p.constructor.fromString !== 'function')
				return s == p.toString();
			q = p.constructor.fromString(q, ...args);
			assert(q != null, 
				   `${p.constructor.name}.fromString: ` +
				   `called by .equals() cannot parse ${s}`);
		} else if (q.constructor.name != p.constructor.name) {
			return false;
		}
		// on reaching here, q is an object that can be compared to p
		if (p.n != q.n) return false;
		return q;
	}

	equals(that, ...args) { return Top.equals(this, that, ...args); }
}
