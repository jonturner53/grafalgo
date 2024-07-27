/** @file Map.mjs
 *
 *  @authoi Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs'
import List from '../basic/List.mjs'
import Scanner from '../basic/Scanner.mjs'
import KeySets from './KeySets.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** Map class implements a set of key-value pairs, each identified by
 *  an integer index. Keys and values may be either number or strings.
 */

export default class Map extends Top {
	keys;      // KeySet used to store keys
	top;       // id of the specific set in keys used to represent map
	Value;     // Value[i] is value paired with key(i) in keys
	Size;      // number of key-value pairs
	free;      // list of unused pair ids

	compare;         // function for comparing two keys
	eqValue;         // function for comparing two values

	/** Constructor for Map object.
	 *  @param n is the initial index range for key-value pairs
	 *  @param stringKey is true if the keys are strings
	 */
	constructor(n=10, compare=((a,b)=>a-b), eqValue=((a,b)=>a===b)) {
		super(n);

		this.compare = compare;
		this.eqValue = eqValue;

		this.keys = new KeySets(n, (a,b)=>this.compare(a,b));
		this.top = 0; this.Size = 0;
		this.Value = new Array(this.n+1);
		this.free = new List(this.n+1);
		for (let i = 1; i <= this.n; i++) this.free.enq(i);
	}

	/** Assign a new value by copying from another Map object.
	 *  @param that is another Map object
	 */
	assign(that, relaxed) {
        ea && assert(that != this &&
                this.constructor.name == that.constructor.name);
        if (this.n == that.n || relaxed && this.n > that.n) this.clear();
        else this.reset(that.n, this.compare, this.eqValue)
		for (let p = that.first(); p; p = that.next(p))
			this.put(that.key(p), that.value(p));
	}
	
	/** Assign a new value by transferring from another Map.
	 *  @param that is another Map object.
	 */
	xfer(that) {
		this.n = that.n;
		this.keys = that.keys; that.keys = null;
		this.Value = that.Value; that.Value = null;
		this.free = that.free; that.free = null;
		this.top = that.top; this.Size = that.Size;

		this.compare = that.compare;
		this.eqValue = that.eqValue;
	}

	/** Expand the max size of this Map. */
	expand(n, consArgs=[this.compare,this.eqValue]) { super.expand(n, consArgs); }

	/** Remove all key-value pairs */
	clear() { while (this.top) this.deletePair(this.top); }

	/** Return the number of key-value pairs. */
	get size() { return this.Size; }

	/** Return true if no key-value pairs. */
	empty() { return this.size == 0; }

	/** Return the first key-value pair. */
	first() { return this.keys.first(this.top); }

	/** Return next key-value pair. */
	next(p) { return this.keys.next(p); }

	/** Get the key for a specified pair. */
	key(p) { return this.keys.key(p); }

	/** Get/set the value for a specified pair. */
	value(p,v) {
		if (v) this.Value[p] = v;
		return this.Value[p];
	}

	/** Get the key-value pair for a specified key.
	 *  @param k is a key in the Map
	 *  @return the integer that identifies the key-value pair for k,
	 *  or 0 if there is none.
	 */
	getPair(k) {
		return this.keys.lookup(k, this.top);
	}
	
	/** Get the value that a given key is mapped to.
	 *  @param k is a key in the Map
	 *  @return the value part of the key-value pair for k or undefined.
	 */
	get(k) {
		let p = this.getPair(k);
		return p ? this.Value[p] : undefined;
	}

	/** Add/modify a key-value pair.
	 *  @param k is a key
	 *  @param v is a value; if there is no pair with key k, the new pair
	 *  (k,v) is added; if there is already a pair with key k, the value part
	 *  of the pair is changed to v; if v is undefined the existing pair with
	 *  key k is deleted
	 *  @return the pair index for the new/modified key-value pair
	 */
	put(k, v=undefined) {
		let p = this.getPair(k);
		if (p) {
			if (v == undefined) {
				this.deletePair(p); return 0;
			}
			this.value(p,v); return p;
		}
		if (v == undefined) return 0;
		p = this.free.deq();
		if (!p) {
			this.expand(Math.max(this.n+10, ~~(1.5*this.n)));
			p = this.free.deq();
		}
		this.keys.key(p,k); this.value(p,v);
		this.top = (this.top ? this.keys.insert(p, this.top) : p);
		this.Size++;
		return p;
	}

	/** Delete mapping for a specified key. */
	delete(k) { let p = this.get(k); if (p) this.deletePair(p); }

	/** Delete a specified key-value pair.
	 *  @param p is an integer that identifies a key-value pair.
	 */
	deletePair(p) {
		if (!p || this.size == 0) return;
		this.top = (this.size > 1 ? this.keys.delete(p, this.top) : 0);
		this.free.enq(p);
		this.value(p,undefined);
		this.Size--;
	}
	
	/** Determine if two Map objects are equal.
	 *  @param that is a Map object to be compared to this
	 *  @return true if both contain the same values.
	 */
	equals(that) {
		that = super.equals(that, [this.n, this.compare, this.eqValue]);
		if ((typeof that) == 'boolean') return that;
		if (this.size != that.size) return false;

		if (''+this.compare != ''+that.compare ||
			''+this.eqValue != ''+that.eqValue)
			return false;

		for (let p = this.first(); p; p = this.next(p)) {
			let pp = that.getPair(this.key(p));
			if (!pp || !this.eqValue(this.value(p), that.value(pp)))
				return false
		}
		return that;
	}
	
	/** Produce a string representation of the Map object.
	 *  @param fmt is an integer used to specify format options
	 *     0001 specifies that the index identifying each pair be shown
	 *  @param label is a function that is used to label identifiers
	 */
	toString(fmt=0, label=0) {
		if (!label) label = (p => this.x2s(p));
		let s = ''; let value = this.Value;
		for (let p = this.first(); p; p = this.next(p)) {
			if (s) s += ' ';
			if (fmt&1) s += label(p) + ':';
			s += this.datum2string(this.key(p)) + ':' +
				 this.datum2string(this.value(p));
		}
		return '{' + s + '}\n';
	}

	/** Initialize this Map object from a string.
	 *  @param s is a string representing a Map.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;

		let pairs = [];
		while (!sc.verify('}')) {
			let k = sc.nextDatum(sc);
			if (k == null) return false;
			if (!sc.verify(':')) return false;
			let v = sc.nextDatum(sc);
			if (v == null) return false;
			pairs.push([k,v]);
		}
		if (this.n < pairs.length) 
			this.reset(pairs.length, this.compare, this.eqValue) 
		else
			this.clear();

		for (let [k,v] of pairs) this.put(k,v);
		return true;
	}
}
