/** @file KeySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import ListSet from '../basic/ListSet.mjs';
import Top from '../Top.mjs';
import BalancedForest from '../trees/BalancedForest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a key set: a collection of disjoint sets with
 *  each set element having an associated key. It supports an efficient
 *  search operation to find an element with a specified key value.
 *  The implementation used here is based on a balanced binary forest.
 *  It can support either numeric keys or strings.
 */
export default class KeySets extends BalancedForest {
	Key;        // Key[u] is the key of item u
	compare;    // function used to compare two keys

	/** Constructor for KeySets object.
	 *  @param n is index range for object
	 *  @param compare is a function for comparing string values
	 */
	constructor(n=10, compare=((a,b)=>(a-b))) {
		super(n); this.compare = compare;
		this.Key = new Array(this.n+1);
	}

	/** Expand this object. */
	expand(n) {
		ea && assert(n > this.n);
		let nu = new KeySets(n, this.compare);
		nu.assign(this,true); this.xfer(nu);
	}

	/** Assign a new value by copying from another KeySets object.
	 *  @param that is another KeySets object
	 */
	assign(that, relaxed=false) {
		super.assign(that, relaxed);
		this.compare = that.compare;
		for (let u = 1; u <= that.n; u++)
			this.key(u, that.key(u));
	}
	
	/** Assign a new value by transferring from another KeySets.
	 *  @param that is another KeySets object.
	 */
	xfer(that) {
		super.xfer(that);
		this.Key = that.Key; that.Key = null;
		this.compare = that.compare; that.compare = null;
	}

	clear() { super.clear(); }

	/** Find the set containing a given item. */
	find(u) { return super.root(u); }
	
	/** Get or set the key value of an item. */
	key(u, k=null) {
		if (k != null) this.Key[u] = k;
		return this.Key[u];
	}
	
	/** Determine if a specified item is in a set.
	 *  @param u is a set item
	 *  @param s is a set
	 *  @return true if u is in s, else false
	 */
	in(u, s) { return s == this.find(u); }
	
	/** Lookup an item in a set based on its key.
	 *  @param k is a key.
	 *  @param s is the id of a set.
	 *  @return an item with the key k or 0.
	 */
	lookup(k, s) {
		return this.search(k, s, this.Key, (a,b) => this.compare(a,b));
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
		return super.insertByKey(u, t, this.Key,
								 (a,b) => { 
											let result = this.compare(a,b);
											return result;}, refresh);
	}

	/** Determine if two KeySets objects are equal.
	 *  @param that is a KeySets object to be compared to this
	 *  @return true if both represent the same sets and the
	 *  keys match; otherwise return false
	 */
	equals(that) {
		that = super.setEquals(that, [this.n, this.compare]);
		if (typeof that == 'boolean') return that;
		if (this.n != that.n) return false;

		for (let u = 1; u <= this.n; u++) {
			if (this.compare(this.key(u), that.key(u))) return false;
		}
		return that;
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
	toString(fmt=0x2, label=0) {
		if (!label) {
			label =
				(x => {
					return this.x2s(x) + ':' + this.key2string(this.key(x)) +
					 	 ((fmt&0x8) && this.rank(x)>1 ? ':'+this.rank(x) : '');
				});
		}
		return super.toString(fmt,label);
	}

	key2string(k) {
		if ((typeof k) == 'string') return '"' + k + '"';
		if ((typeof k) == 'number' || (typeof k) == 'boolean') return k;
		if ((typeof k) == 'object') return JSON.stringify(k);
	}
	
	/** Initialize this KeySets object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let ls = new ListSet(); let keyMap = [];
		if (!ls.fromString(s, (u,sc) => {
							if (!sc.verify(':')) return false;
							let k = this.nextKey(sc);
							if (k == null) return false;
							keyMap.push([u,k]);
							return true;
						}))
			return false;
		this.reset(ls.n, this.compare);

		for (let [u,k] of keyMap) this.key(u,k);
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			let s = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				s = this.insert(i,s);
			}
		}
		return true;
	}

	nextKey(sc) {
		if (sc.verify('"',1,0))  {
			let s = sc.nextString(0);
			return s == null ? false : s;
		}
		if (sc.verify('{',1,0)) {
			let s = sc.nextString(1,'{','}',0);
			if (s == null) return null;
			try { let k = JSON.parse(s); return k; } catch { return null; }
		}
		if (sc.verify('[',1,0))  {
			let s = sc.nextString(1,'[',']',0);
			if (s == null) return null;
			try { let k = JSON.parse(s); return k; } catch { return null; }
		}
		let n = sc.nextNumber(); return (n == NaN ? null : n);
	}
}
