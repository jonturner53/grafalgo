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

//import { fassert } from '../../common/Errors.mjs';
let fassert = (()=>1);

/** This class implements a data structure consisting of a disjoint
 *  set of leftist heaps.
 */
export default class LazyHeaps extends LeftistHeaps {
	nn;		 // largest valid index for a non-dummy node
	#dummy;		// first node in list of free dummy nodes
	#retired;	// #retired is either a user-supplied function
				// or an array of bits
	#plist;		// temporary list used by purge

	purgesteps;

	/** Constructor for LazyHeaps object.
	 *  @param n is index range for object
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired.
	 */
	constructor(n=20, retired=null) {
		super((n&1) ? n+1 : n); this.nn = this.n/2;

		for (let i = this.nn+1; i <= this.n; i++) this.rank(i,-1);
		this.#plist = new List(this.nn);
		if (retired != null) this.#retired = retired;
		else this.#retired = new Int8Array(this.n+1).fill(false);

		// implement list of dummy nodes as a tree
		for (let i = this.nn+1; i < this.n; i++) this.link(i+1,i,1);
		this.#dummy = this.nn+1;

		this.clearStats();
	}

	expand(n) {
		fassert(false /*, 'LazyHeaps: expand not implemented'*/);
	}

	/** Assign a new value by copying from another heap.
	 *  @param lh is another LazyHeaps object
	 */
	assign(lh) {
		if (lh == this || (!lh instanceof LazyHeaps)) return;
		if (lh.n != this.n) {
			this.reset(lh.n, typeof lh.#retired == 'function' ?
							 lh.#retired : null);
		} else {
			this.clear();
		}
		for (let r = 1; r <= lh.n; r++) {
			if (lh.p(r) || lh.rank(r) < 0) continue;
			let rr = lh.first(r);
			for (let u = lh.next(rr); u; u = lh.next(u)) {
				if (u > lh.nn) continue;
				rr = this.insert(u, rr, lh.key(u));
			}
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(lh) {
		if (lh == this || (!lh instanceof LazyHeaps)) return;
		super.xfer(lh);
		this.nn = lh.nn;
		this.#retired = lh.#retired; lh.#retired = null;
	}

	/** Revert to initial state. */
	clear() {
		super.clear();
		for (let i = this.nn+1; i <= this.n; i++) this.rank(i,-1);
		for (let i = this.nn+1; i < this.n; i++) this.link(i+1,i,1);
		this.#dummy = this.nn+1;
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
		if (this.#retired.constructor != 'function')
			this.#retired[i] = true;
	}

	/** Determine if a heap item is retired.
	 *  @param i is a heap item
	 *  @return true if i has been retired (either explicitly or implicitly
	 *  through user-provided retired function)
	 */
	retired(i) {
		return i <= this.nn &&
						(typeof this.#retired == 'function' ?
				   		 this.#retired(i) : this.#retired[i]);
	}

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) {
		this.#plist.clear(); this.#purge(h);
		return this.heapify(this.#plist);
	}

	/** Remove the item with smallest key from a heap.
	 *  @param h is a heap
	 *  @return the pair [i, hnew] where i is the deleted heap item
	 *  and hnew is the modified heap
	 */
	deletemin(h) {
		this.deleteCount++;
		h = this.findmin(h);  // purges top of heap
		let lh = this.left(h); let rh = this.right(h);
		if (lh) this.cut(lh); if (rh) this.cut(rh);
		let hnew = this.lazyMeld(lh,rh);
		this.rank(h,1);
		return [h,hnew];
	}

	/** Remove deleted items from the top of a heap and construct list
	 *  of subheaps with non-deleted roots.
	 *  @param h is a heap to be purged
	 */
	#purge(h) {
		if (h == 0) return;
		this.purgesteps++;
		fassert(this.valid(h));
		if (this.isactive(h)) {
			this.#plist.enq(h);
		} else {
			this.#purge(this.left(h)); this.#purge(this.right(h));
			if (this.isdummy(h)) {
				this.link(this.#dummy, h, +1); this.#dummy = h;
			}
			this.rank(h,-1);
		}
		if (this.p(h)) this.cut(h); 
	}

	/** Lazy meld a pair of heaps */
	lazyMeld(h1, h2) {
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
		fassert(this.valid(h1));
		fassert(this.valid(h1) && this.valid(h2) && this.#dummy);
		if (this.rank(h1) < this.rank(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
		let d = this.#dummy; this.#dummy = this.right(d);
		this.cut(this.#dummy);
		this.join(h1,d,h2);
		this.rank(d, this.rank(h2) + 1);
		this.key(d, Number.NEGATIVE_INFINITY);
		return d;
	}
	
	/** Determine if two LazyHeaps objects represent the same sets.
	 *  @param lh is a LazyHeaps object to be compared to this
	 *  @return true if both represent the same sets.
	 */
	equals(lh) {
		if (this === lh) return true;
        if (typeof lh == 'string') {
            let s = lh; lh = new LazyHeaps(this.n);
			if (!lh.fromString(s)) return s == this.toString();
        }
		if (lh.constructor.name != 'LazyHeaps' || lh.n != this.n)
			return false;
		let l = new List(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) || u == this.#dummy) continue;
			l.clear();
			for (let v = this.first(u); v; v = this.next(v)) {
				if (this.isactive(v)) l.enq(v);
			}
			let len = 0;
			for (let v = lh.first(lh.find(l.first())); v; v = lh.next(v)) {
				if (!lh.isactive(v)) continue;
				if (!l.contains(v)) return false;
				if (this.key(v) != lh.key(v)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return lh;
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
		if (!label) label = x => this.x2s(x);
		let xlabel;
		if (fmt&0x4) {
			xlabel = x =>
						(this.isdummy(x) ? ''+x : label(x)) +
			   			(!this.isactive(x) ? '!' : (':' + this.key(x)) + 
							((fmt&0x8) ? ':'+this.rank(x) : ''));
		} else {
			xlabel = x => label(x) + ':' + this.key(x);
		}
		let s = '';
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			if (this.singleton(u) && !(fmt&0x2)) continue;
			if (selectHeap && u != selectHeap) continue;
			if (u == this.#dummy) continue;
			if (!(fmt&0x01) && s) s += ' ';
			if (fmt&0x4) {
				s += `${super.tree2string(u,fmt,xlabel)}`;
				if (fmt&0x01) s += '\n';
			} else {
				let ss = '';
				for (let v = this.first(u); v; v = this.next(v)) {
					if (!this.isactive(v)) continue;
					if (ss) ss += ' ';
					ss += xlabel(v);
				}
				if (ss) s += '[' + ss + ']' + (fmt&0x01 ? '\n' : '');
			}
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
