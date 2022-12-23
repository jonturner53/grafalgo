/** @file Map.mjs
 *
 *  @authoi Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs'
import List from '../basic/List.mjs'
import Scanner from '../basic/Scanner.mjs'
import KeySets from './KeySets.mjs';

/** Generic Map class.  */

export default class Map extends Top {
	#keys;			// KeySet used to store keys
	#top		    // id of the specific set in #keys used to represent map
	#value;		    // #value[i] is value paired with key(i)
	#size;          // number of key-value pairs
	#free;			// list of unused pair ids

	comparKeys;
	nextKey;
	key2string;
	
	equalValues;    // function comparing two values for equality
	nextValue;      // function used to scan next input value
	value2string;   // function used to create string version of value

	/** Constructor for Map object.
	 */
	constructor(n=10, compareKeys, equalValues, nextKey, nextValue,
					  key2string, value2string) {
		super(n);

		this.compareKeys = (compareKeys ? compareKeys : (a,b)=>a-b);
		this.equalValues = (equalValues ? equalValues : (a,b)=>a-b);
		this.nextKey = (nextKey ? nextKey :
							(sc) => {
	                            let p = sc.nextNumber();
	                            return (Number.isNaN(p) ? null : p);
	                        });
		this.nextValue = (nextValue ? nextValue :
							(sc) => {
	                            let p = sc.nextNumber();
	                            return (Number.isNaN(p) ? null : p);
	                        });
		this.key2string = (key2string ? key2string : k => ''+k);
		this.value2string = (value2string ? value2string : k => ''+k);

		this.#keys = new KeySets(n, this.compareKeys, this.nextKey,
									this.key2string);
		this.#top = 0; this.#size = 0;
		this.#value = new Array(this.n+1).fill(0);
		this.#free = new List(this.n+1);
		for (let i = 1; i <= this.n; i++) this.#free.enq(i);
	}

	/** Assign a new value by copying from another Map object.
	 *  @param other is another Map object
	 */
	assign(other, relaxed) {
        fassert(other != this &&
                this.constructor.name == other.constructor.name);
        if (this.n == other.n || relaxed && this.n > other.n) this.clear();
        else this.reset(other.n, other.compareKeys, other.equalValues,
								 other.nextKey, other.nextValue,
								 other.key2string, other.value2string);
		for (let p = other.first(); p; p = other.next(p))
			this.put(other.key(p), other.value(p));
	}
	
	/** Assign a new value by transferring from another Map.
	 *  @param other is another Map object.
	 */
	xfer(other) {
		this._n = other.n;
		this.#keys = other.#keys; other.#keys = null;
		this.#value = other.#value; other.#value = null;
		this.#free = other.#free; other.#free = null;
		this.#top = other.#top; this.#size = other.#size;

		this.compareKeys = other.compareKeys;
		this.equalValues = other.equalValues;
		this.nextKey = other.nextKey;
		this.nextValue = other.nextValue;
		this.key2string = other.key2string;
		this.value2string = other.value2string;
	}

	/** Expand the max size of this Map and possibly. */
	expand(n) {
		fassert(n > this.n);
		let nu = new this.constructor(n,
						this.compareKeys, this.equalValues,
						this.nextKey, this.nextValue,
						this.key2string, this.value2string);
		nu.assign(this,true);
		this.xfer(nu);
	}

	clear() { while (this.#top) this.deletePair(this.#top); }

	get size() { return this.#size; }
	empty() { return this.size == 0; }

	first() { return this.#keys.first(this.#top); }
	next(p) { return this.#keys.next(p); }

	key(p, k) { return this.#keys.key(p,k); }

	value(p, v) {
		if (v) this.#value[p] = v;
		return this.#value[p];
	}

	/** Get the key-value pair for a specified key.
	 *  @param k is a key in the Map
	 *  @return the integer that identifies the key-value pair for k,
	 *  or 0 if there is none.
	 */
	getPair(k) {
		return this.#keys.includes(k, this.#top);
	}

	/** Delete a specified key-value pair.
	 *  @param p is an integer that identifies a key-value pair.
	 */
	deletePair(p) {
		if (!p || this.size == 0) return;
		this.#top = (this.size > 1 ? this.#keys.delete(p, this.#top) : 0);
		this.#free.enq(p);
		this.value(p,undefined);
		this.#size--;
	}
	
	/** Get the value that a given key is mapped to.
	 *  @param k is a key in the Map
	 *  @return the value part of the key-value pair for k or 0.
	 */
	get(k) {
		let p = this.#keys.includes(k, this.#top);
		return p ? this.#value[p] : 0;
	}

	put(k, v) {
		let p = this.#keys.includes(k, this.#top);
		if (p) { this.value(p,v); return p; }
		p = this.#free.deq();
		if (!p) {
			this.expand(Math.max(this.n+10, ~~(1.5*this.n)));
			p = this.#free.deq();
		}
		this.key(p, k);
		this.#top = this.#keys.insert(p, this.#top)
		this.value(p,v);
		this.#size++;
		return p;
	}

	delete(k) { let p = this.get(k); if (p) this.deletePair(p); }
	
	/** Determine if two Map objects are equal.
	 *  @param other is a Map object to be compared to this
	 *  @return true if both contain the same values.
	 */
	equals(other) {
		if (this === other) return true;
        if (typeof other == 'string') {
            let s = other;
			other = new this.constructor(this.n,
						this.compareKeys, this.equalValues,
						this.nextKey, this.nextValue,
						this.key2string, this.value2string);
			if (!other.fromString(s)) return s == this.toString();
        } else if (other.constructor.name != this.constructor.name) {
			return false;
		}
		if (this.size != other.size) return false;
		for (let p = this.first(); p; p = this.next(p)) {
			let pp = other.getPair(this.key(p));
			if (!pp || this.equalValues(this.value(p), other.value(pp)))
				return false
		}
		return other;
	}
	
	/** Produce a string representation of the Map object.
	 *  @param fmt is an integer used to specify format options
	 *     0001 specifies that the integer identifying each pair be shown
	 *  @param label is a function that is used to pair identifiers
	 */
	toString(fmt=0, label=0) {
		if (!label) label = (p => this.x2s(p));
		let s = '';
		for (let p = this.first(); p; p = this.next(p)) {
			if (s) s += ' ';
			if (fmt&1) s += label(p) + ':';
			s += this.key2string(this.key(p)) + ':' +
				 this.value2string(this.value(p));
		}
		return '{' + s + '}';
	}
	
	/** Initialize this Map object from a string.
	 *  @param s is a string representing a Map.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let pairs = []; let n = 0;
		while (!sc.verify('}')) {
			let k = this.nextKey(sc);
			if (k == null || !sc.verify(':'))
				return false;
			let v = this.nextValue(sc);
			if (v == null)
				return false;
			pairs.push([k,v]);
			n++;
		}
		if (n > this.n)
			this.reset(n, this.compareKeys, this.equalValues,
						  this.nextKey, this.nextValue,
						  this.key2string, this.value2string);
		else this.clear();

		for (let [k,v] of pairs) {
			this.put(k,v);
		}
		return true;
	}
}
