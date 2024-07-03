/** @file LazyHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';
import LeftistHeaps from './LeftistHeaps.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of leftist heaps.
 */
export default class LazyHeaps extends LeftistHeaps {
	nn;         // largest valid index for a non-dummy node
	dummy;      // first node in list of free dummy nodes
	Retired;    // Retired is either a user-supplied function
				// or an array of bits
	plist;     // temporary list used by purge

	purgesteps;

	/** Constructor for LazyHeaps object.
	 *  @param n is index range for object
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired.
	 */
	constructor(n=10, retired=null) {
		super((n&1) ? n+1 : n); this.nn = this.n/2;

		for (let i = this.nn+1; i <= this.n; i++) this.rank(i,-1);
		this.plist = new List(this.nn);
		if (retired != null) this.Retired = retired;
		else this.Retired = new Int8Array(this.n+1).fill(false);

		// implement list of dummy nodes as a tree
		for (let i = this.nn+1; i < this.n; i++) this.link(i+1,i,1);
		this.dummy = this.nn+1;

		this.clearStats();
	}

	expand(n) {
		ea && assert(false, 'LazyHeaps: expand not implemented');
	}

	/** Assign a new value by copying from another heap.
	 *  @param that is another LazyHeaps object
	 */
	assign(that) {
		if (that == this || (!that instanceof LazyHeaps)) return;
		if (that.n != this.n) {
			this.reset(that.n, typeof that.Retired == 'function' ?
							 that.Retired : null);
		} else {
			this.clear();
		}
		for (let r = 1; r <= that.n; r++) {
			if (that.p(r) || that.rank(r) < 0) continue;
			let rr = that.first(r);
			for (let u = that.next(rr); u; u = that.next(u)) {
				if (u > that.nn) continue;
				rr = this.insert(u, rr, that.key(u));
			}
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(that) {
		if (that == this || (!that instanceof LazyHeaps)) return;
		super.xfer(that);
		this.nn = that.nn; this.dummy = that.dummy;
		this.Retired = that.Retired; that.Retired = null;
	}

	/** Revert to initial state. */
	clear() {
		super.clear();
		for (let i = this.nn+1; i <= this.n; i++) this.rank(i,-1);
		for (let i = this.nn+1; i < this.n; i++) this.link(i+1,i,1);
		this.dummy = this.nn+1;
	}

	clearStats() { super.clearStats(); this.purgesteps = 0; }

	find(i) { return super.root(i); }

	/** Determine if a node is a dummy.
	 *  @param i is a node index
	 *  @return true if i is a dummy node (possibly in-use)
	 */
	isdummy(i) { return i > this.nn; }

	/** Determine if a node is active.
	 *  @param i is a node index
	 *  @return true if i is neither a dummy, nor a retired item.
	 */
	isactive(i) { return i <= this.nn && !this.retired(i); }

	valid(i) {
		return i >= 0 && (i <= this.nn || (i <= this.n && this.rank(i) >= 0));
	}

	/** Retire a heap item.
	 *  Retired heap items do not belong to any heap and cannot be
	 *  used in the future.
	 *  @param i is a heap item to be retired.
	 */
	retire(i) {
		if (this.Retired.constructor != 'function')
			this.Retired[i] = true;
	}

	/** Determine if a heap item is retired.
	 *  @param i is a heap item
	 *  @return true if i has been retired (either explicitly or implicitly
	 *  through user-provided retired function)
	 */
	retired(i) {
		return i <= this.nn &&
						(typeof this.Retired == 'function' ?
				   		 this.Retired(i) : this.Retired[i]);
	}

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) {
		this.plist.clear(); this.purge(h);
		return this.heapify(this.plist);
	}

	/** Remove the item with smallest key from a heap.
	 *  @param h is a heap
	 *  @return the pair [i, hnew] where i is the deleted heap item
	 *  and hnew is the modified heap
	 */
	deletemin(h) {
		this.deleteCount++;
		if (!this.isactive(h)) h = this.findmin(h);  // purge top of heap
		return super.deletemin(h);
/*
		let lh = this.left(h); let rh = this.right(h);
		if (lh) this.cut(lh); if (rh) this.cut(rh);
		let hnew = this.lazyMeld(lh,rh);
		this.rank(h,1);
		return [h,hnew];
*/
	}

	/** Remove deleted items from the top of a heap and construct list
	 *  of subheaps with non-deleted roots.
	 *  @param h is a heap to be purged
	 */
	purge(h) {
		if (h == 0) return;
		this.purgesteps++;
		ea && assert(this.valid(h));
		if (this.isactive(h)) {
			this.plist.enq(h);
		} else {
			this.purge(this.left(h)); this.purge(this.right(h));
			if (this.isdummy(h)) {
				this.link(this.dummy, h, +1); this.dummy = h;
			}
			this.rank(h,-1);
		}
		if (this.p(h)) this.cut(h); 
	}

	/** Lazy meld a pair of heaps */
	lazyMeld(h1, h2) {
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
		ea && assert(this.valid(h1));
		ea && assert(this.valid(h1) && this.valid(h2) && this.dummy);
		if (this.rank(h1) < this.rank(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
		let d = this.dummy; this.dummy = this.right(d);
		this.cut(this.dummy);
		this.join(h1,d,h2);
		this.rank(d, this.rank(h2) + 1);
		this.key(d, Number.NEGATIVE_INFINITY);
		return d;
	}
	
	/** Determine if two LazyHeaps objects represent the same sets.
	 *  @param that is a LazyHeaps object to be compared to this
	 *  @return true if both represent the same sets.
	 */
	equals(that) {
		if (this === that) return true;
        if (typeof that == 'string') {
            let s = that; that = new LazyHeaps(this.n);
			if (!that.fromString(s)) return s == this.toString();
        }
		if (that.constructor.name != 'LazyHeaps' || that.n != this.n)
			return false;
		let l = new List(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) || u == this.dummy) continue;
			l.clear();
			for (let v = this.first(u); v; v = this.next(v)) {
				if (this.isactive(v)) l.enq(v);
			}
			let len = 0;
			for (let v = that.first(that.find(l.first())); v; v=that.next(v)) {
				if (!that.isactive(v)) continue;
				if (!l.contains(v)) return false;
				if (this.key(v) != that.key(v)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return that;
	}


	/** Create a ListSet that defines lists with the same items as
	 *  the heaps of this object.
	 *  @return the computed ListSet.
	 */
	toListSet() {
		let ls = new ListSet(this.nn);
		for (let h = 1; h <= this.nn; h++) {
			if (this.p(h)) continue;
			let f = 0;
			for (let u = this.first(h); u; u = this.next(u)) {
				if (this.retired(u) || this.isdummy(u)) continue;
				if (!f) f = u;
				else ls.join(f,u);
			}
		}
		return ls;
	}
	

	/** Produce a string representation of this LazyHeaps object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *	0b0001 specifies newlines between sets
	 *	0b0010 specifies that singletons be shown
	 *	0b0100 specifies that the underlying tree structure be shown
	 *	0b1000 specifies that the ranks be shown
	 *  default for fmt is 0b0010
	 *  @param label is an optional function used to generate the label for
	 *  the heap item
	 *  @param selectHeap is an optional heap id; if present, only this
	 *  heap is included in the string
	 */
	toString(fmt=0x2, label=0, selectHeap=0) {
		if (!label) label = x => `${this.x2s(x)}:${this.key(x)}`;
		if (!(fmt&4)) return this.toListSet().toString(fmt&3,label);

		let xlabel = x => !this.isactive(x) ? (this.p(x) ? '!' : '') : 
								label(x) + ((fmt&0x8) && this.rank > 1 ?
											`:${this.rank(x)}` : '');

		let s = '';
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			if (this.singleton(u) && !(fmt&0x2)) continue;
			if (selectHeap && u != selectHeap) continue;
			if (u == this.dummy) continue;
			if (!(fmt&0x01) && s) s += ' ';
			s += `${super.tree2string(u,xlabel)}`;
			if (fmt&0x01) s += '\n';
		}
		if (selectHeap) return s;
		return fmt&0x1 ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Initialize this LazyHeaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on if success, else false
	 */
	fromString(s) {
		let ls = new ListSet(); let key = [];
		if (!ls.fromString(s, (u,sc) => {
							if (!sc.verify(':')) {
								key[u] = 0; return true;
							}
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key[u] = p;
							return true;
						}))
			return false;
		if (2*ls.n != this.n) this.reset(2*ls.n);
		else this.clear();
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			this.key(u, key[u]);
			let h = u;
			for (let i = ls.next(u); i; i = ls.next(i))
				h = this.insert(i, h, key[i]);
		}
		return true;
	}

	getStats() {
		return { 'meldsteps' : this.meldsteps,
				 'purgesteps' : this.purgesteps,
				 'steps' : this.meldsteps + this.purgesteps
				};
	}
}
