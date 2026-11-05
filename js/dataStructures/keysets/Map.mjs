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

import { assert, assertEnabled as ae} from '../../common/Assert.mjs';

/** Map class implements a set of key-value pairs, each identified by
 *  an integer index. Keys and values may be either number or strings.
 */

export default class Map extends Top {
	keys_;      // KeySet used to store keys
	top_;       // id of the specific set in keys used to represent map
	value_;     // value_[i] is value paired with key(i) in keys
	size_;      // number of key-value pairs

	free_;      // list of unused pair ids

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

		this.keys_ = new KeySets(n, compare);
		this.top_ = 0; this.size_ = 0;
		this.value_ = new Array(this.n+1);
		this.free_ = new List(this.n+1);
		for (let i = 1; i <= this.n; i++) this.free_.enq(i);
	}

	/** Remove all key-value pairs */
	clear() { while (this.top_) this.deletePair(this.top_); }

	/** Return the number of key-value pairs. */
	get size() { return this.size_; }

	/** Return true if no key-value pairs. */
	empty() { return this.size == 0; }

	/** Return the first key-value pair. */
	first() { return this.keys_.first(this.top_); }

	/** Return next key-value pair. */
	next(p) { return this.keys_.next(p); }

	/** Get the key for a specified pair. */
	key(p) { return this.keys_.key(p); }

	/** Get/set the value for a specified pair. */
	value(p,v) {
		if (v) this.value_[p] = v;
		return this.value_[p];
	}

	/** Get the key-value pair for a specified key.
	 *  @param k is a key in the Map
	 *  @return the integer that identifies the key-value pair for k,
	 *  or 0 if there is none.
	 */
	getPair(k) {
		return this.keys_.lookup(k, this.top_);
	}
	
	/** Get the value that a given key is mapped to.
	 *  @param k is a key in the Map
	 *  @return the value part of the key-value pair for k or undefined.
	 */
	get(k) {
		let p = this.getPair(k);
		return p ? this.value_[p] : undefined;
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
		p = this.free_.deq();
		this.keys_.key(p,k); this.value(p,v);
		this.top_ = (this.top_ ? this.keys_.insert(p, this.top_) : p);
		this.size_++;
		return p;
	}

	/** Delete mapping for a specified key. */
	delete(k) { let p = this.getPair(k);
				if (p) this.deletePair(p); }

	/** Delete a specified key-value pair.
	 *  @param p is an integer that identifies a key-value pair.
	 */
	deletePair(p) {
		if (!p || this.size == 0) return;
		this.top_ = (this.size > 1 ? this.keys_.delete(p, this.top_) : 0);
		this.free_.enq(p);
		this.value(p,undefined);
		this.size_--;
	}
	
	/** Determine if two Map objects are equal.
	 *  @param that is a Map object to be compared to this
	 *  @return true if both contain the same values.
	 */
	equals(that,...args) {
		that = super.equals(that, ...(args.length ? args :
									  [this.n,this.compare,this.eqValue]));
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
		let s = ''; let value = this.value_;
		for (let p = this.first(); p; p = this.next(p)) {
			if (s) s += ' ';
			if (fmt&1) s += label(p) + ':';
			s += Top.datum2string(this.key(p)) + ':' +
				 Top.datum2string(this.value(p));
		}
		return '{' + s + '}\n';
	}

	/** Initialize this Map object from a string.
	 *  @param s is a string representing a Map.
	 *  @return on if success, else false
	 */
	static fromString(s, n=10, compare=((a,b)=>a-b), eqValue=((a,b)=>a===b)) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return null;
		let pairs = [];
		while (!sc.verify('}')) {
			let k = sc.nextDatum(sc);
			if (k == null) return null;
			if (!sc.verify(':')) return null;
			let v = sc.nextDatum(sc);
			if (v == null) return null;
			pairs.push([k,v]);
		}
		let map = new Map(Math.max(n, pairs.length), compare, eqValue);

		for (let [k,v] of pairs) map.put(k,v);
		return map;
	}
}
