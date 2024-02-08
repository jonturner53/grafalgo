/** @file LeftistHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import BinaryForest from '../trees/BinaryForest.mjs';
import Scanner from '../basic/Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of leftist heaps.
 */
export default class LeftistHeaps extends BinaryForest {
	Key;    	// Key[i] is key of item i
	Rank;	    // Rank[i] gives rank of item i

    meldsteps;         // steps in meld operations

	/** Constructor for LeftistHeaps object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired.
	 */
	constructor(n=10) {
		super(n);

		this.Key = new Float32Array(this.n+1)
		this.Rank = new Int32Array(this.n+1).fill(1,1);

	    this.clearStats();
	}

	/** Assign a new value by copying from another heap.
	 *  @param other is another LeftistHeaps object
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);
		for (let r = 1; r <= other.n; r++) {
			if (other.p(r)) continue;
			let rr = other.first(r);
			for (let u = other.next(rr); u; u = other.next(u))
				rr = this.insert(u, rr, other.key(u));
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(other) {
		super.xfer(other);
		this.Key = other.Key; this.Rank = other.Rank;
		other.Key = other.Rank = null;
	}

	/** Revert to initial state. */
	clear() {
		super.clear();
		this.Key.fill(0); this.Rank.fill(1,1);
	}

	clearStats() {
		super.clearStats(); this.meldsteps = 0;
	}

	/** Return key of a heap item. */
	key(i, k=false) {
		if (k !== false) this.Key[i] = k;
		return this.Key[i];
	}

	/** Return rank of a heap item. */
	rank(i, r=false) {
		if (r !== false) this.Rank[i] = r;
		return this.Rank[i];
	}

	/** Meld two heaps.
	 *  @param h1 is a heap
	 *  @param h2 is a second heap
	 *  @return the identifier of the result of melding h1 and h2
	 */
	meld(h1, h2) {
		this.meldsteps++;
		// relies on null node having rank==0
		if (h1 == 0) return h2;
		if (h2 == 0 || h1 == h2) return h1;
		if (this.key(h1) > this.key(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
		this.link(this.meld(this.right(h1), h2), h1, +1);

		if (this.rank(this.left(h1)) < this.rank(this.right(h1))) {
			let h = this.left(h1);
			this.link(this.right(h1),h1,-1);
			this.link(h,h1,+1);
		}
		this.rank(h1, this.rank(this.right(h1)) + 1);
		return h1;
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton.
	 *  @param h is a heap to which i is inserted.
	 *  @param k is the key under which i is inserted
	 *  @return the id of the modified heap
	 */
	insert(i, h, k) {
		this.insertCount++;
		ea && assert(this.valid(i) && this.valid(h));
		ea && assert(this.left(i) == 0 && this.right(i) == 0 && this.rank(i) == 1);
		this.key(i, k);
		return this.meld(i, h);
	}
	
	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) { return h; }

	/** Remove the item with smallest key from a heap.
	 *  @param h is a heap
	 *  @return the pair [i, hnew] where i is the deleted heap
	 *  item and hnew is the modified heap
	 */
	deletemin(h) {
		this.deleteCount++;
		let lh = this.left(h); let rh = this.right(h);
		if (lh) this.cut(lh); if (rh) this.cut(rh);
		let hnew = this.meld(lh, rh);
		this.Rank[h] = 1;
		return [h,hnew];
	}

	/** Combine a List of heaps into a single heap.
	 *	@param hlist is a List object containing a list of heaps
	 *  @param return the root of the combined heap.
	 */
	heapify(hlist) {
		if (hlist.empty()) return 0;
		while (hlist.length > 1) {
			let h = this.meld(hlist.at(1), hlist.at(2));
			hlist.deq(); hlist.deq(); hlist.enq(h);
		}
		return hlist.first();
	}

	/** Determine if two LeftistHeaps objects are equal.
	 *  @param other is another LeftistHeaps to be compared to this,
	 *  or a string representing an LeftistHeaps object.
	 *  @return true, false or an object
	 */
	equals(other) {
		let lh = super.setEquals(other);
        if (typeof lh == 'boolean') return lh;
		for (let i = 1; i <= this.n; i++) {
			if (this.key(i) != lh.key(i)) return false;
		}
		return lh;
	}

	/** Produce a string representation of the KeySets object.
	 *  @param fmt is an integer with low order bits specifying format options.
	 *    0b0001 specifies newlines between sets
	 *    0b0010 specifies that singletons be shown
	 *    0b0100 specifies that the underlying tree structure be shown
	 *    0b1000 specifies that the ranks be shown
	 *  @param label is an optional function used to generate the label for
	 *  the heap item; if omitted x2s() is used
	 *  default for fmt is 0b010
	 */
	toString(fmt=0b010,label=0) {
		if (!label) {
			label = (x => this.x2s(x) + (':' + this.key(x)) +
						  ((fmt&0x8) ? ':'+this.rank(x) : ''));
		}
		return super.toString(fmt,label);
	}

	/** Initialize this LeftistHeaps object from a string.
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
		if (ls.n != this.n) this.reset(ls.n);
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
		return { 'meld' : this.meldsteps,
				 'steps' : this.meldsteps
				};
	}
}
