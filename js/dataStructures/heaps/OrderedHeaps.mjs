/** @file OrderedHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import BalancedForest from '../trees/BalancedForest.mjs';
import Scanner from '../basic/Scanner.mjs';

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

/** This class implements a data structure consisting of a disjoint
 *  set of heaps, with an efficient add2keys operation and an efficient
 *  divide() operation for dividing a heap into two parts.
 *  The heap items have a key that is used in the usual
 *  heap operations, but each heap also defines 
 *  a "list ordering" that is independent of the keys.
 *  One can iterate through the items in the defined order and
 *  insert items relative to one another.
 *  
 *  This data structure was originally devised to support
 *  Galil, Micali and Gabow's variant of Edmonds algorithm
 *  for weighted matching in general graphs.
 */
export default class OrderedHeaps extends BalancedForest {
	/** Constructor for OrderedHeaps object.
	 *  @param n is index range for object
	 */
	constructor(n=10) {
		ae = assertEnabled();
		super(n);
		// the kee and minkee properties are uncorrected (no offset)
		// alternate spelling allows names key and minkey to be
		// used for methods that return corrected values
		this.addProperty('kee', 0);
		this.addProperty('minkee', 0);
		this.addProperty('offset', 0);
	}

	/** Clear heaps, converting them to singletons.
	 *  @param h is a heap; if non-zero, the specified heap is cleared,
	 *  otherwise all are.
	 */
	clear(h=0) {
		if (h) {
			let offset = this.offset(h);
			for (let u = super.first(h); u; u = super.next(u)) {
				this.kee(u, this.kee(u) + offset);
				this.minkee(u, this.kee(u));
				this.offset(u, 0);
			}
		} else {
			this.reset_kee(); this.reset_minkee(); this.reset_offset();
		}
		super.clear(h);
	}

	/** Find the heap containing a given item. 
	 *  @param i is an item in some heap
	 *  @return the id of the heap containing i
	 */
	find(i) { return super.root(i); }

	/** Determine if an item is contained in a heap.
	 *  @param i is a heap item
	 *  @param h is a heap
	 *  @return true if h contains i, else false
	 */
	contains(i, h) { return this.find(i) == h }

	/** Get (corrected) key of a heap item. */
	key(i, h=this.find(i)) {
		return this.kee(i) + this.offset(h);
	}

	/** Get (corrected) minkey of a heap item. */
	minkey(i, h=this.find(i)) {
		return this.minkee(i) + this.offset(h);
	}

	/** Add increment to all the keys in a heap
	 *  @param delta is an increment to be added to the keys in a heap
	 *  @param h is the heap to be modeified.
	 */
	add2keys(delta, h) { if (h) this.offset(h, this.offset(h)+delta); }

	/** Change the key of a heap item.
	 *  @param i is an item in a heap.
	 *  @param h is the heap containing i
	 *  @param k is the new key value for i
	 */
	changekey(i, k, h) {
		this.kee(i,k-this.offset(h));
		this.refresh(i);
	}

	/** Insert an item in a heap.
	 *  @param i is a heap item
	 *  @param k is the key with which i is inserted
	 *  @param h is the heap into which i is inserted
	 *  @return id of modified heap.
	 */
	insert(i, k, h) {
		return this.insertAfter(i, k, this.last(h), h);
	}

	/** Insert item into a heap at a specified point in the linear
	 *  ordering of the heap items.
	 *  @param i is a singleton to be added to a heap
	 *  @param k is the key under which i is inserted
	 *  @param j is an item in h; item i is inserted immediately after j;
	 *  if j=0, i is inserted before the first item in the heap
	 *  @param h is a heap into which i is to be inserted; if h=0, the
	 *  the singleton heap i is returned
	 *  @return the id of the modified heap
	 */
	insertAfter(i, k, j, h=this.find(j)) {
		ae && assert(this.valid(i) && this.valid(j) && this.valid(h));
		if (h == 0) {
			this.kee(i,k); this.minkee(i,k); return i;
		}
		let offset = this.offset(h);
		this.kee(i, k-offset); this.minkee(i, this.kee(i));
		h = super.insertAfter(i, j, h, x => this.refresh(x));
		this.offset(h, offset);
		return h;
	}

	/** Delete an item from a heap.
	 *  @param i is an item in a heap
	 *  @param h is the heap containing i
	 *  @return the id of the resulting heap
	*/
	delete(i, h=this.find(i)) {
		if (this.singleton(i)) return;
		let offset = this.offset(h);
		// identify an item near the root that is not i
		let hh = (i != h ? h : (this.left(h) ? this.left(h) : this.right(h)));
		super.delete(i, h, pi => this.refresh(pi));
		hh = this.find(hh);
		this.offset(hh, offset);
		this.kee(i, this.key(i)+offset); this.minkee(i,this.kee(i));
		this.offset(i,0);
		return hh;
	}

	/** Divide a heap before a specified item.
	 *  @param i is an item
	 *  @param h is the heap containing i
	 *  @returns [h1,h2) where h1 is the heap consisting of the items
	 *  that come before i in h and h2 is the heap consisting
	 *  of i and the items that come after it
	 */
	divide(i, h=this.find(i)) {
		let offset = this.offset(h);
		let [h1,h2] = super.split(i);
		if (h1) this.offset(h1,offset);
		if (h2) this.offset(h2,offset);
		this.minkee(i, this.kee(i)); this.offset(i, offset);
		h2 = this.join(0,i,h2);
		this.offset(h2,offset);
		return [h1,h2];
	}

	/** Limited join operation, for use when all arguments have same offset.
	 *  Provided to support joins done within splits within super class.
	 */
	join(t1, u, t2) { return super.join(t1, u, t2, u => this.refresh(u)); }

	/** Update minkey fields, following a change to an item. */
	refresh(i) {
		while (i) {
			let min = this.kee(i);
			let l = this.left(i); let r = this.right(i);
			if (l) min = Math.min(min, this.minkee(l));
			if (r) min = Math.min(min, this.minkee(r));
			this.minkee(i,min);
			i = this.p(i);
			this.steps++;
		}
	}

	/** Return an item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @param which specifies which item of minimum key to return;
	 *  if which==-1, the "leftmost" item is minimum key is returned,
	 *  if which==+1, the "rightmost" is returned and if which==0, the
	 *  first item of minimum key that is encountered is returned
	 *  @return the item in h that has the smallest key
	 */
	findmin(h, which=0) {
		if (!h) return 0;
		let k = this.minkee(h);
		let i = h;
		while (i) {
			let l = this.left(i); let r = this.right(i);
			if (this.kee(i) == k) {
				if (which == 0 ||
					which == -1 && (!l || this.minkee(l) != k) ||
					which == +1 && (!r || this.minkee(r) != k)) {
					return i;
				}
			}
			i = (l && this.minkee(l) == k ? l : r);
			this.steps++;
		}
		ae && assert(false,
					 `program error in OrderedHeaps.findmin(${this.x2s(h)})`);
	}

	/** Remove a miniminum key item from from the heap and return it.
	 *  @param h is a heap.
	 *  @return [u,h] where u is the min key item and h is the id of the
	 *  resulting heap
	 */
	deletemin(h) {
		let u = this.findmin(h); h = this.delete(u,h);
		return [u,h];
	}

	/** Extend rotation operation to maintain minkee field. */
	rotate(x) {
		let y = this.p(x);
		if (y == 0) return;
		super.rotate(x);
		this.minkee(x, this.minkee(y)); 
		let min = this.kee(y);
		let l = this.left(y); let r = this.right(y);
		if (l) min = Math.min(min, this.minkee(l));
		if (r) min = Math.min(min, this.minkee(r));
		this.minkee(y,min);
		if (!this.p(x)) this.offset(x,this.offset(y));
	}

	/** Determine if two OrderedHeaps objects are equal.
	 *  @param that is another OrderedHeaps to be compared to this,
	 *  or a string representing an OrderedHeaps object.
	 *  @return true, false or an object
	 */
	equals(that) {
		that = super.listEquals(...(arguments.length==1 ?
								[that,this.n] : arguments));
        if (typeof that == 'boolean') return that;
		if (this.n != that.n) return false;

		for (let i = 1; i <= this.n; i++) {
			if (this.key(i,this.find(i)) != that.key(i,that.find(i)))
				return false;
		}
		return that;
	}

	/** Produce a string representation of the OrderedHeap object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b0001 specifies newlines between sets
	 *    0b0010 specifies that singletons be shown
	 *    0b0100 specifies that the underlying tree structure be shown
	 *    0b1000 specifies that the minkey values be shown
	 *  @param label is an optional function used to generate the label for
	 *  the heap item
	 *  default for fmt is 0b010
	 */
	toString(fmt=0x2,label=0) {
		if (!label) {
			label = (x => {
						let ks = (this.key(x) == Infinity ?
								 'I' : '' + this.key(x));
						let ms = (this.minkey(x) == Infinity ?
								 'I' : '' + this.minkey(x));
						return this.x2s(x) + ':' + ks +
						  		((fmt&0x8) ? ':' + ms : '');
						});
		}
		return super.toString(fmt&0x7,label);
	}

	/** Initialize this OrderedHeaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on success, else false
	 */
	static fromString(s, n=10) {
		let key = [];
		let ls = ListSet.fromString(s, n, 0, 0, 0,
						(u,sc) => {
							if (!sc.verify(':',0)) {
								key[u] = 0; return true;
							}
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key[u] = p;
							return true;
						});
		if (!ls) return null;
		let oh = new OrderedHeaps(ls.n);

		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			oh.kee(u, key[u]);
			oh.minkee(u, key[u]);
			let h = u; let pi = u;
			for (let i = ls.next(u); i; i = ls.next(i)) {
				h = oh.insertAfter(i, key[i], pi, h);
				pi = i;
			}
		}
		return oh;
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			let mk = this.key(u);
			let l = this.left(u); let r = this.right(u);
			if (l) mk = Math.min(mk, this.minkey(l));
			if (r) mk = Math.min(mk, this.minkey(r));
			if (this.minkey(u) != mk) {
				return `minkey mismatch at ${this.x2s(u)} ` +
					   `${this.minkey(u)}!=${mk}=min(` +
					   (l ? ''+this.minkey(l) : '-') +
					   `,${this.key(u)},` +
					   (r ? ''+this.minkey(r) : '-') + ')';
			}
		}
		return '';
	}
}
