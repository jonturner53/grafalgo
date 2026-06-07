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

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

/** This class implements a data structure consisting of a disjoint
 *  set of leftist heaps.
 */
export default class LazyHeaps extends LeftistHeaps {
	N;			// number of items in heap from client perspective
	nodeRange;	// total number of items, including dummy nodes
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
	ae = assertEnabled();
		super(2*n); this.N = n; this.nodeRange = 2*n;

		for (let i = this.n+1; i <= this.nodeRange; i++) this.rank(i,-1);
		this.plist = new List(this.n);
		if (retired != null) this.Retired = retired;
		else this.Retired = new Int8Array(this.n+1).fill(false);

		// implement list of dummy nodes as a tree
		for (let i = this.n+1; i < this.nodeRange; i++) this.link(i+1,i,1);
		this.dummy = this.n+1;

		this.clearStats();
	}

	get n() { return this.N; }

	/** Revert to initial state. */
	clear() {
		super.clear();
		for (let i = this.n+1; i <= this.nodeRange; i++) this.rank(i,-1);
		for (let i = this.n+1; i < this.nodeRange; i++) this.link(i+1,i,1);
		this.dummy = this.n+1;
	}

	clearStats() { super.clearStats(); this.purgesteps = 0; }

	find(i) { return super.root(i); }

	/** Determine if a node is a dummy.
	 *  @param i is a node index
	 *  @return true if i is a dummy node (possibly in-use)
	 */
	isdummy(i) { return i > this.n; }

	/** Determine if a node is active.
	 *  @param i is a node index
	 *  @return true if i is neither a dummy, nor a retired item.
	 */
	isactive(i) { return i <= this.n && !this.retired(i); }

	valid(i) {
		return i >= 0 && (i <= this.n ||
						  (i <= this.nodeRange && this.rank(i) >= 0));
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
		return i <= this.n &&
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
	}

	/** Remove deleted items from the top of a heap and construct list
	 *  of subheaps with non-deleted roots.
	 *  @param h is a heap to be purged
	 */
	purge(h) {
		if (h == 0) return;
		this.purgesteps++;
		ae && assert(this.valid(h));
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
		ae && assert(this.valid(h1) && this.valid(h2) && this.dummy);
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
		// implementation note: not using super classes to assist
		// with implementation due to the presence of dummy nodes
		if (this === that) return true;
        if (typeof that == 'string') {
            let s = that;
			that = LazyHeaps.fromString(s, this.n, this.Retired);
			assert(typeof that === 'object', 
				   'LazyHeaps.fromString: ' +
			             'called by .equals() cannot parse ' + s);
        } else if (that.constructor.name != 'LazyHeaps') {
			return false;
        } else if (this.n != that.n) {
			return false;
		}

		let ls1 = this.toListSet(); let ls2 = that.toListSet();
		if (!ls1.setEquals(ls2)) return false;

		for (let u = 1; u <= this.n; u++)
			if (this.key(u) != that.key(u)) return false;

		return that;
	}

	/** Create a ListSet that defines lists with the same items as
	 *  the heaps of this object.
	 *  @return the computed ListSet.
	 */
	toListSet() {
		let ls = new ListSet(this.n);
		for (let h = 1; h <= this.nodeRange; h++) {
			if (this.p(h) || h == this.dummy) continue;
			let f = this.first(h);
			for (let u = this.next(f); u; u = this.next(u)) {
				if (this.isactive(u)) ls.join(f,u);
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
	 *  heap is included in the string.
	 */
	toString(fmt=0x2, label=0, selectHeap=0) {
		if (!label) label = x => `${this.x2s(x)}:${this.key(x)}`;
		if (!(fmt&4)) return this.toListSet().toString(fmt&3,label);

		let xlabel = x => this.isdummy(x) ? 'D' : 
							(this.retired(x) ? 'R' :
								label(x) + ((fmt&0x8) && this.rank(x) > 1 ?
											`:${this.rank(x)}` : ''));
		let s = '';
		for (let h = 1; h <= this.nodeRange; h++) {
			if (this.p(h) || h == this.dummy) continue;
			if (this.singleton(h) && !(fmt&0x2)) continue;
			if (selectHeap && h != selectHeap) continue;
			if (h == this.dummy) continue;
			if (!(fmt&0x01) && s) s += ' ';
			if (!this.singleton(h)) s += '[';
			s += `${super.tree2string(h,xlabel)}`;
			if (!this.singleton(h)) s += ']';
			if (fmt&0x01) s += '\n';
		}
		s = s.replaceAll('*!', '*');
		if (selectHeap) return s;
		return fmt&0x1 ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Initialize this LazyHeaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on if success, else false
	 */
	static fromString(s, n=10, retired=null) {
		let key = [];
		let ls = ListSet.fromString(s, n, (u,sc) => {
							if (!sc.verify(':',0)) {
								key[u] = 0; return true;
							}
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key[u] = p;
							return true;
						});

		if (!ls) return null;
		let lh = new LazyHeaps(ls.n, retired);
		for (let u = 1; u <= ls.n; u++) {
			if (!ls.isfirst(u)) continue;
			lh.key(u, key[u]);
			let h = u;
			for (let i = ls.next(u); i; i = ls.next(i))
				h = lh.insert(i, h, key[i]);
		}
		return lh;
	}

	getStats() {
		return { 'meldsteps' : this.meldsteps,
				 'purgesteps' : this.purgesteps,
				 'steps' : this.meldsteps + this.purgesteps
				};
	}
}
