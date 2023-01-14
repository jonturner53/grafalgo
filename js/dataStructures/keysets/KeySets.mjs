/** @file KeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import ListSet from '../basic/ListSet.mjs';
import Top from '../Top.mjs';
import BalancedForest from '../trees/BalancedForest.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class KeySets extends BalancedForest {
	#key;        // #key[u] is the key of item u
	compare;     // element comparison function
	nextKey;     // function to scan next key
	key2string;  // function to convert key to string

	/** Constructor for KeySets object.
	 *  @param n is index range for object
	 */
	constructor(n=10, compare, nextKey, key2string) {
		super(n);
		this.#key = new Array(this.n+1);
		this.compare = (compare ? compare : (a,b)=>a-b);
		this.nextKey = (nextKey ? nextKey :
							(sc) => {
                            	let p = sc.nextNumber();
                            	return (Number.isNaN(p) ? null : p);
                        	});
		this.key2string = (key2string ? key2string : k => ''+k);
	}

	/** Expand this object. */
	expand(n) {
		fassert(n > this.n);
		let nu = new KeySets(n,this.compare,this.nextKey,this.key2string);
		nu.assign(this,true); this.xfer(nu);
	}

	/** Assign a new value by copying from another KeySets object.
	 *  @param other is another KeySets object
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);
		this.compare = other.compare;
		this.nextKey = other.nextKey; this.key2string = other.key2string;
		for (let u = 1; u <= other.n; u++)
			this.key(u, other.key(u));
	}
	
	/** Assign a new value by transferring from another KeySets.
	 *  @param other is another KeySets object.
	 */
	xfer(other) {
		super.xfer(other);
		this.#key = other.#key; other.#key = null;
		this.compare = other.compare; other.compare = null;
		this.nextKey = other.nextKey; other.nextKey = null;
		this.key2string = other.key2string; other.key2string = null;
	}

	clear() { super.clear(); this.#key.fill(0); }

	/** Find the set containing a given item. */
	find(u) { return super.root(u); }
	
	/** Get or set the key value of a node. */
	key(u, k=null) {
		if (k != null) this.#key[u] = k;
		return this.#key[u];
	}
	
	/** Determine if a specified item is contained in a set.
	 *  @param u is a set item
	 *  @param s is a set
	 *  @return true if u is in s, else false
	 */
	contains(u, s) { return s == this.find(u); }
	
	/** Determine if a given set contains an item with a specified key.
	 *  @param k is a key.
	 *  @param s is the id of a set.
	 *  @return an item with the key k or 0.
	 */
	includes(k, s) {
		return this.search(k, s, this.#key, this.compare);
	}
	
	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of its tree)
	 *  @param refresh(u) is an optional function that is called after u
	 *  is inserted into its search tree, but before the tree is rebalanced.
	 *  @return the id of the set following insertion
	 */
	insert(u, t, refresh=0) {
		if (u > this.n) this.expand(u);
		return super.insertByKey(u, t, this.#key, this.compare, refresh);
	}

	/** Determine if two KeySets objects are equal.
	 *  @param other is a KeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(other) {
		if (this === other) return true;

		// must handle the string case here to ensure other
		// has correct compare function
        if (typeof other == 'string') {
            let s = other;
			other = new KeySets(this.n, this.compare,
								this.nextKey, this.key2string);
			if (!other.fromString(s)) return s == this.toString();
			if (other.n > this.n) return false;
			if (other.n < this.n) other.expand(this.n);
        }

		if (!super.setEquals(other)) return false;

		for (let u = 1; u <= this.n; u++) {
			if (this.compare(this.key(u),other.key(u)) != 0) return false;
		}
		return other;
	}
	
	/** Produce a string representation of the KeySets object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b0001 specifies newlines between sets
	 *    0b0010 specifies that singletons be shown
	 *    0b0100 specifies that the underlying tree structure be shown
	 *    0b1000 specifies that the ranks be shown
	 *  default for fmt is 0b010
	 *  @param label is a function that is used to insert one or more
	 *  additional node fields following the key
	 *  numerical values, not letters.
	 */
	toString(fmt=0b010, label=0) {
		if (!label) {
			label = (x => this.x2s(x) + ':' + this.key2string(this.key(x)) +
					 (fmt&0x8 ? ':' + this.rank(x) : ''));
		}
		return super.toString(fmt,label);
	}
	
	/** Initialize this KeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let ls = new ListSet(); let key = [];
		if (!ls.fromString(s, (u,sc) => {
							if (!sc.verify(':')) {
								key[u] = 0; return true;
							}
							let k = this.nextKey(sc);
							if (k == null) return false;
							key[u] = k;
							return true;
						}))
			return false;
		if (ls.n != this.n)
			this.reset(ls.n, this.compare, this.nextKey, this.key2string);
		else
			this.clear();
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			this.key(u, key[u]);
			let s = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				this.key(i, key[i]);
				s = this.insert(i,s);
			}
		}
		return true;
	}
}
