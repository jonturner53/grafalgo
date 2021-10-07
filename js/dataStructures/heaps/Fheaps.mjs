/** @file Fheaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Adt from '../Adt.mjs';
import List from '../basic/List.mjs';
import Dlists from '../basic/Dlists.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of Fibonacci heaps.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when an Fheaps object is constructed.
 */
export default class Fheaps extends Adt {
	#key;		///< #key[i] is key of item i
	#rank;		///< #rank[i] gives rank of item i
	#mark;		///< #mark[i] is true if item i is considered marked
	#p;			///< #p[i] is the parent of item i in its heap
	#c;			///< #c[i] is some child of item i in its heap
	#sibs;		///< #sibs is a Dlists object containing sibling lists

	#rankVec;	///< #rankVec is an auxiliary array used during restructuring
	#tmpq;		///< #tmpq is a List object used as a temporary queue 

	#MAXRANK = 32;

	/** Constructor for Fheaps object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize Fheaps object.
	 *  @param nMax is the maximum range
	 */
	#init(capacity) {
		this.#key = new Array(capacity+1).fill(0);
		this.#rank = new Array(capacity+1).fill(0);
		this.#mark = new Array(capacity+1).fill(false);
		this.#p = new Array(capacity+1).fill(0);
		this.#c = new Array(capacity+1).fill(0);
		this.#sibs = new Dlists(this.n, capacity);

		this.#rankVec = new Array(this.#MAXRANK+1).fill(0);
		this.#tmpq = new List(this.n, capacity);
	}

	get _capacity() { return this.#key.length-1; }

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}
	
	/** Assign a new value by copying from another heap.
	 *  @param fh is another Fheaps object
	 */
	assign(fh) {
		if (fh == this) return;
		if (fh.n > this.n) { reset(fh.n); }
		else { clear(); this._n = fh.n; }

		this.#sibs.assign(fh.#sibs);
		for (let i = 1; i < fh.n; i++) {
			this.#key[i] = fh.#key[i];
			this.#rank[i] = fh.#rank[i];
			this.#mark[i] = fh.#mark[i];
			this.#p[i] = fh.#p[i];
			this.#c[i] = fh.#c[i];
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(fh) {
		if (fh == this) return;
		if (!(fh instanceof Fheaps)) return;
		this.#key = fh.#key; this.#rank = fh.#rank; this.#mark = fh.#mark;
		this.#p = fh.#p; this.#c = fh.#c; this.#sibs = fh.#sibs;
		this.#rankVec = fh.#rankVec; this.#tmpq = fh.#tmpq;
		fh.#key = fh.#rank = fh.#p = fh.#c = fh.#mark = fh.#sibs = null;
		fh.#rankVec = fh.#tmpq = null;
	}
	
	/** Expand the space available for this Fheaps.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Fheaps(this.n,
								Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#key.fill(0, this.n+1, n+1);
		this.#rank.fill(0, this.n+1, n+1);
		this.#mark.fill(false, this.n+1, n+1);
		this.#p.fill(0, this.n+1, n+1);
		this.#c.fill(c, this.n+1, n+1);
		this._n = n;
	}

	/** Remove all elements from heap. */
	clear() {
		this.#sibs.clear();
		for (let i = 0; i < this.n; i++) {
			this.#key[i] = this.#rank[i] = this.#p[i] = this.#c[i] = 0;
			this.#mark[i] = false;
		}
	}

	/** Return key of a heap item. */
	key(i) { return this.#key[i]; }

	/** Return ran k of a heap item. */
	rank(i) { return this.#rank[i]; }

	/** Return mark of a heap item. */
	mark(i) { return this.#mark[i]; }

	/** Return parent of a heap item. */
	p(i) { return this.#p[i]; }

	/** Return a child of a heap item. */
	c(i) { return this.#c[i]; }

	/** Set the key of a singleton heap item. */
	setKey(i, k) { assert(this.singleton(i)); this.#key[i] = k; }

	/** Determine if an item is defines a singleton heap.
	 *  @param i is a heap item
	 *  @return true if it is a singleton.
	 */
	singleton(i) {
		return this.#sibs.singleton(i) && this.#p[i] == 0 && this.#c[i] == 0;
	}

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) { return h; }

	/** Built a heap from a list of singletons.
	 *  @param hl is a List object containing singleton items
	 *  @param return the heap containing the listed items
	 */
	makeheap(hl) {
		let h = hl.first();
		if (h == 0) return 0;
		let minh = h;
		for (let h1 = hl.next(h); h1 != 0; h1 = hl.next(h1)) {
			if (this.key(h1) < this.key(minh)) minh = h1;
			this.#sibs.join(h, h1);
		}
		return minh;
	}

	meld(h1, h2) {
		assert((h1 == 0 || (this.valid(h1) && this.p(h1) == 0)) &&
			   (h2 == 0 || (this.valid(h2) && this.p(h2) == 0)));
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
		return (this.key(h1) <= this.key(h2) ? this.#sibs.join(h1, h2) :
											   this.#sibs.join(h2, h1));
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton.
	 *  @param h is a heap to which i is inserted.
	 *  @param k is the key under which i is inserted
	 */
	insert(i, h, k) { this.setKey(i, k); return this.meld(i, h); }
	
	/** Decrease the key of an item in a heap.
	 *  @param i is an item
	 *  @param delta is the amount by which i is to be decreased
	 *  @param h is the heap containing i
	 *  @return the modified heap
	 */
	decreaseKey(i, delta, h) {
		let key = this.#key; let rank = this.#rank; let mark = this.#mark;
		let p = this.#p; let c = this.#c; let sibs = this.#sibs;
		assert(this.valid(i) && this.valid(h) && p[h] == 0);
		key[i] -= delta;
		if (p[i] == 0) {
			if (key[h] > key[i])
				h = sibs.rotate(h, i);
			return h;
		}
		let pi = p[i];
		if (key[i] >= key[pi]) return h;
		do {
			rank[pi]--;
			c[pi] = sibs.delete(i, c[pi]);
			p[i] = 0; mark[i] = false; h = this.meld(h, i);
			i = pi; pi = p[i];
		} while (mark[i]); // note: if i is marked, it's not a root
		if (pi != 0) mark[i] = true;
	
		return h;
	}

	/** Merge the tree roots in heap, to eliminate repeated ranks.
	 *  @param r is a tree root in a heap; all tree roots are assumed
	 *  to be non-deleted nodes; also r is the id of the root list in sibs
	 *  @return the resulting root with the smallest key
	 */
	mergeRoots(r) {
		let key = this.#key; let rank = this.#rank; let mark = this.#mark;
		let p = this.#p; let c = this.#c; let sibs = this.#sibs;
		let tmpq = this.#tmpq; let rankVec = this.#rankVec;

		assert(this.valid(r) && p[r] == 0);

		// Build queue of roots and find root with smallest key
		let minRoot = r;
		for (let sr = r; sr != 0; sr = sibs.next(sr)) {
			if (key[sr] < key[minRoot]) minRoot = sr;
			tmpq.enq(sr); p[sr] = 0; mark[sr] = false;
		}
		r = sibs.rotate(r, minRoot); // r is now is min root
		// scan roots, merging trees of equal rank
		let maxRank = -1; // maxRank = maximum rank seen so far
		while (!tmpq.empty()) {
			let r1 = tmpq.pop();
			assert(rank[r1] <= this.#MAXRANK);
			let r2 = rankVec[rank[r1]];
			if (maxRank < rank[r1]) {
				for (maxRank++; maxRank < rank[r1]; maxRank++)
					rankVec[maxRank] = 0;
				rankVec[rank[r1]] = r1;
			} else if (r2 == 0) {
				rankVec[rank[r1]] = r1;
			} else if (key[r1] < key[r2] || (key[r1] == key[r2] && r1 == r)) {
				r = sibs.delete(r2, r);
				c[r1] = sibs.join(c[r1], r2);
				rankVec[rank[r1]] = 0;
				rank[r1]++; p[r2] = r1;
				tmpq.enq(r1);
			} else {
				r = sibs.delete(r1, r);
				c[r2] = sibs.join(c[r2], r1);
				rankVec[rank[r1]] = 0;
				rank[r2]++; p[r1] = r2;
				tmpq.enq(r2);
			}
		}
		return r;
	}
		
	/** Remove the item with smallest key from a heap.
	 *  @param h is the canonical element of some heap
	 *  @return the canonical element of the heap that results from
	 *  removing the item with the smallest key
	 */
	deletemin(h) {
		let p = this.#p; let c = this.#c; let sibs = this.#sibs;
		assert(this.valid(h) && p[h] == 0);
	
		// Merge h's children into root list and delete it
		// First, make parent pointers of new root nodes 0
		if (c[h] != 0) {
			for (let i = c[h]; i != 0; i = sibs.next(i))
				p[i] = 0;
			sibs.join(h,c[h]); c[h] = 0;
		}
		this.#rank[h] = 0;
		if (sibs.singleton(h)) return 0;
		return this.mergeRoots(sibs.delete(h, h));
	}
	
	/** Delete an item from a heap.
	 *  @param i is an item in some heap
	 *  @param h is the heap containing i
	 *  @return the heap that results from removing i from h
	 */
	delete(i, h) {
		assert(this.valid(i) && this.valid(h) && this.p(h) == 0);
		let k = this.key(i);
		h = decreaseKey(i, (this.key(i) - this.key(h)) + 1, h);
		h = deletemin(h);
		this.#key[i] = k;
		return h;
	}
	
	/** Determine if two Fheaps objects are equal.
	 *  @param h is another Fheaps to be compared to this, or a string
	 *  representing an Fheaps object.
	 *  @return if h is an Fheaps, return true if the heaps in both contain
	 *  the same items with the same keys; if h is a string, compare the
	 *  the string representation of this to h; otherwise, return false
	 */
	equals(fh) {
		if (this === fh) return true;
		if (typeof fh == 'string') {
			let s = fh; fh = new Fheaps(this.n); fh.fromString(s);
		}
		if (!(fh instanceof Fheaps) || this.n != fh.n)
			return false;

		let top1 = this.#top(); let top2 = fh.#top();
		for (let i = 0; i < this.n; i++) {
			if (this.key(i) != fh.key(i) || top1[i] != top2[i])
				return false;
		}
		return true;
	}

	/** Compute a vector that labels each heap item with the top item
	 *  in its heap.
	 *  @return a vector top, where top[i] is the canonical element
	 *  of the heap containing i.
	 */
	#top() {
		let top = new Array(this.n+1).fill(0);
			// label each item with item at the top of its heap
		for (let i = 1; i <= this.n; i++) {
			// search path towards top item
			let j = i;
			while (top[j] == 0 && this.p(j) != 0)
				j = this.p(j)
			while (top[j] == 0 && !this.#sibs.isFirst(j))
				j = this.#sibs.prev(j);
			if (top[j] == 0) top[j] = j;
			let topItem = top[j];
			// now, repeat search, updating top values
			j = i;
			while (top[j] == 0 && this.p(j) != 0) {
				top[j] = topItem; j = this.p(j)
			}
			while (top[j] == 0 && !this.#sibs.isFirst(j)) {
				top[j] = topItem; j = this.#sibs.prev(j);
			}
		}
		return top;
	}
	
	/** Construct a string representation of this object.
	 *  @param s is a string in which the result is returned
	 *  @return the string
	 */
	toString(details=0, pretty=0, strict=0) {
		let s = '';
		let done = new Array(this.n+1).fill(false);
		for (let i = 1; i < this.n; i++) {
			if (this.p(i) != 0 || done[i]) continue;
			// i is in a heap we've not yet added to s
			let h = this.#sibs.findList(i);
			if (s != '') s += ' ';
			s += this.#heap2string(h, details, strict);
			if (pretty) s += '\n'; // one heap per line
			// mark all tree roots in this heap as done
			for (let r = h; r != 0; r = this.#sibs.next(r))
				done[r] = true;
		}
		return pretty ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Create a string representation of one heap.
	 *  @param h is an item that identifies a heap or some
	 *  item that is a first child of another heap item
	 *  @return a string that represents the heap, or the
	 *  portion of the heap including h and its siblings
	 */
	#heap2string(h, details=0, strict=0) {
		let s = '';
		for (let i = h; i != 0; i = this.#sibs.next(i)) {
			if (i != h) s += ' ';
			s += this.index2string(i, strict) + ':' + this.key(i);
			if (details)
				s += (this.mark(i) ? '*' : ':') + this.rank(i);
			if (this.#c[i] != 0)
				s += this.#heap2string(this.#c[i], details, strict);
		}
		return (details || this.p(h) == 0 ? '(' + s + ')' : ' ' + s);
	}

	/** Initialize this Fheaps object from a string.
	 *  @param s is a string representing a heap.
	 *  @return true on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('{')) return false;
		while (sc.verify('(')) {
			let h = sc.nextIndex();
			for (let i = h; i != 0; i = sc.nextIndex()) {
				if (!sc.verify(':')) { this.clear(); return false; }
				let key = sc.nextFloat();
				if (isNaN(key)) { this.clear(); return false; }
				if (i != h) this.insert(i, h, key);
				else this.setKey(i, key);
			}
			if (!sc.verify(')')) { this.clear(); return false; }
		}
		if (!sc.verify('}')) { this.clear(); return false; }
		return true;
	}
}
