/** @file FibHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Forest from '../trees/Forest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of Fibonacci heaps.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when an FibHeaps object is constructed.
 */
export default class FibHeaps extends Forest {
	Key;        // Key[i] is key of node/item i
	Rank;       // Rank[i] gives rank of node/item i
	Mark;       // Mark[i] is true if node/item i is considered marked

	rankVec;    // rankVec is an auxiliary array used during restructuring
	tmpq;       // tmpq is a List object used as a temporary queue 

	changekeys;
	decreasekeySteps;
	mergesteps;

	MAXRANK = 32;

	/** Constructor for FibHeaps object.
	 *  @param n is index range for object
	 */
	constructor(n=10) {
		super(n);
		this.Key = new Float32Array(this.n+1);
		this.Rank = new Int32Array(this.n+1);
		this.Mark = new Int8Array(this.n+1);
		this.rankVec = new Int32Array(this.MAXRANK+1);
		this.tmpq = new List(this.n);

		this.clearStats();
	}

	/** Assign a new value by copying from another heap.
	 *  @param that is another FibHeaps object
	 */
	assign(that, relaxed=false) {
		super.assign(that, relaxed);
		for (let i = 1; i < that.n; i++) {
			this.Key[i] = that.Key[i];
			this.Rank[i] = that.Rank[i];
			this.Mark[i] = that.Mark[i];
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another heap.
	 *  @param that is another heap
	 */
	xfer(that) {
		super.xfer(that);
		this.Key = that.Key; this.Rank = that.Rank; this.Mark = that.Mark;
		this.rankVec = that.rankVec; this.tmpq = that.tmpq;
		that.Key = that.Rank = that.Mark = that.rankVec = that.tmpq = null;
		this.clearStats();
	}
	
	/** Remove all elements from heap. */
	clear() {
		super.clear();
		for (let i = 0; i < this.n; i++) {
			this.Key[i] = this.Rank[i] = 0; this.Mark[i] = false;
		}
	}

	clearStats() {
		this.changekeys = this.decreasesteps = this.mergesteps = 0;
	}

	/** Get/set the key of a node. */
	key(i, v=false) {
		if (v !== false) this.Key[i] = v;
		return this.Key[i];
	}

	/** Get/set the rank of a node. */
	rank(i, r=false) {
		if (r !== false) this.Rank[i] = r;
		return this.Rank[i];
	}

	/** Return mark of a node. */
	mark(i, m=-1) { 	
		if (m != -1) this.Mark[i] = m;
		return this.Mark[i];
	}

	/** Return a child of a node. */
	c(i) { return this.firstChild(i); }

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) { return h; }

	/** Build a heap from a list of singletons.
	 *  @param hl is a List object containing singleton items
	 *  @param return the heap containing the listed items
	 */
	makeheap(hl) {
		let h = hl.first();
		if (h == 0) return 0;
		let minh = h;
		for (let h1 = hl.next(h); h1 != 0; h1 = hl.next(h1))
			h = this.meld(h,h1);
		return minh;
	}

	meld(h1, h2) {
		if (h1 == 0) return h2;
		if (h2 == 0 || h1 == h2) return h1;
		return (this.key(h1) <= this.key(h2) ?
					this.combineGroves(h1, h2) : this.combineGroves(h2, h1));
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton.
	 *  @param h is a heap to which i is inserted.
	 *  @param k is the key under which i is inserted
	 */
	insert(i, h, k) {
		if (i > this.n) this.expand(i);
		this.key(i,k); return this.meld(i, h);
	}
	
	/** Change the key of an item in a heap.
	 *  @param i is an item
	 *  @param h is the heap containing i
	 *  @param k is the new key value for i
	 *  @return the modified heap
	 */
	changekey(i, h, k) {
		this.changekeys++;
		if (k > this.key(i)) { // increasing key
			h = this.delete(i, h);
			return this.insert(i, (h != 0 ? h : i), k);
		}
		// decreasing key
		this.key(i,k);
		if (!this.p(i)) {
			if (this.key(h) > this.key(i)) {
				this.rotate(h,i); h = i;
			}
			return h;
		}
		let pi = this.p(i);
		if (this.key(i) >= this.key(pi)) return h;
		do {
			this.decreasesteps++;
			this.cut(i); this.rank(pi,this.rank(pi)-1);
			this.mark(i,false);
			h = this.meld(h, i);
			i = pi; pi = this.p(i);
		} while (this.mark(i)); // note: if i is marked, it's not a root
		if (pi != 0) this.mark(i,true);
		return h;
	}

	/** Merge the tree roots in heap, to eliminate repeated ranks.
	 *  @param r0 is the first tree root in the grove defining a heap;
	 *  it is called after the node with the smallest key is removed from heap
	 *  @return the root of the the tree root with the smallest key,
	 *  following the merging
	 */
	mergeRoots(r0) {
		let key = this.Key; let rank = this.Rank;
		let tmpq = this.tmpq; let rvec = this.rankVec;

		// Build queue of roots and find root with smallest key
		let minRoot = r0;
		for (let sr = r0; sr; sr = this.nextSibling(sr)) {
			this.mergesteps++;
			if (key[sr] < key[minRoot]) minRoot = sr;
			tmpq.enq(sr); this.mark(sr,false);
		}
		r0 = this.rotate(r0, minRoot); // r0 is now min root
		// scan roots, merging trees of equal rank
		let maxRank = -1; // maxRank = maximum rank seen so far
		while (!tmpq.empty()) {
			this.mergesteps++;
			let r1 = tmpq.pop(); let r2 = rvec[rank[r1]];
			let rank1 = rank[r1];
			if (maxRank < rank1) {
				rvec[rank1] = r1;
				for (maxRank++; maxRank < rank1; maxRank++)
					rvec[maxRank] = 0;
			} else if (r2 == 0) {
				rvec[rank1] = r1;
			} else if (key[r1] < key[r2] || (key[r1] == key[r2] && r1 == r0)) {
				this.remove(r2,r0);
				this.link(r2,r1); tmpq.enq(r1);
				rvec[rank1] = 0; rank[r1]++;
			} else {
				this.remove(r1,r0);
				this.link(r1,r2); tmpq.enq(r2);
				rvec[rank1] = 0; rank[r2]++;
			}
		}
		return r0;
	}
		
	/** Remove the item with smallest key from a heap.
	 *  @param h is the top item of some heap
	 *  @return the pair [min, h'] where min is the deleted item
	 *  and h' is the id of the modified heap
	 */
	deletemin(h) {
		// Move h's children into root list and delete h
		for (let i = this.firstChild(h); i; i = this.firstChild(h)) {
			this.cut(i); this.combineGroves(h,i);
		}
		this.rank(h,0);
		if (!this.nextSibling(h)) return [h,0];
		let r = this.remove(h,h); // r is first root remaining in tree group
		return [h, (r ? this.mergeRoots(r) : 0)];
	}
	
	/** Delete an item from a heap.
	 *  @param i is an item in some heap
	 *  @param h is the heap containing i
	 *  @return the heap that results from removing i from h
	 */
	delete(i, h) {
		let k = this.key(i);
		h = this.changekey(i, h, (this.key(i) - this.key(h)) + 1);
		h = this.deletemin(h);
		this.key(i,k);
		return h;
	}
	
	/** Determine if two FibHeaps objects are equal.
	 *  @param that is another FibHeaps to be compared to this, or a string
	 *  representing an FibHeaps object.
	 *  @return if true or false or an object that can be compared further
	 */
	equals(that) {
		that = super.setEquals(that);
        if (typeof that == 'boolean') return that;
		for (let i = 0; i < this.n; i++) {
			if (this.key(i) != that.key(i)) return false;
		}
		return that;
	}
	
	/** Construct a string representation of this object.
	 *  @param fmt is an integer in which low bits are format options
	 *		00001 specifies that heaps appear on separate lines
	 *		00010 specifies that singleton trees are shown
	 *		00100 specifies that tree structure is shown
	 *		01000 specifies that mark bits are shown
	 *		10000 specifies that rank values are shown
	 *  @param selectHeap specifies a single heap to be included
	 *  @return the string
	 */
	toString(fmt=0x2, label=0, selectHeap=0) {
		if (!label) {
			label = (u => `${this.x2s(u)}:${this.key(u)}` +
						  (fmt&0x10 && this.rank(u) ? `:${this.rank(u)}` : '') +
						  ((fmt&0x08 && this.mark(u)) ? '!' : ''));
		}
		return super.toString(fmt&0x7, label, selectHeap);
	}

	/** Initialize this FibHeaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on success, else false
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
		for (let h = 1; h <= ls.n; h++) {
			if (!ls.isfirst(h)) continue;
			this.key(h, key[h]);
			for (let i = ls.next(h); i; i = ls.next(i))
				h = this.insert(i, h, key[i]);
		}
		return true;
	}

	getStats() {
		return { 'changekeys' : this.changekeys,
				 'decreasesteps' : this.decreasesteps,
				 'mergesteps' : this.mergesteps,
				 'steps' : this.decreasesteps + this.mergesteps
				};
	}

	verify() {
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u) && this.key(u) < this.key(this.p(u)))
				return `heap-order violation at ${this.x2s(u)} ` +
						`(${this.key(u)} this.key(this.p(u))})`;
			let ru = 0;
			for (let c = this.firstChild(u); c; c = this.nextSibling(c))
				ru++;
			if (this.rank(u) != ru)
				return `rank violation at ${this.x2s(u)} ` +
						`(${this.rank(u)} ${ru})`;

			if (this.p(u) || this.prevSibling(u)) continue;
			let minkey = this.key(u);
			for (let r = this.nextSibling(u); r; r = this.nextSibling(r))
				minkey = Math.min(minkey,this.key(r));
			if (this.key(u) != minkey)
				return `first tree in heap ${this.x2s(u)} does not have ` +
						`smallest key (${minkey} ${this.key(u)})`;
		}
		return '';
	}
}
