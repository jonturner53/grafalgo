/** @file Lheaps.mjs
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
import Dsets from '../basic/Dsets.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of Fibonacci heaps.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when an Lheaps object is constructed.
 */
export default class Lheaps extends Adt {
	_key;		///< _key[i] is key of item i
	_rank;		///< _rank[i] gives rank of item i
	_left;		///< _left[i] is left child of i
	_right;		///< _right[i] is right child of i

	/** Constructor for Lheaps object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize Lheaps object.
	 *  @param nMax is the maximum range
	 */
	#init(capacity) {
		this._key = new Array(capacity+1).fill(0, 0, this.n+1);
		this._rank = new Array(capacity+1).fill(1, 0, this.n+1);
		this._rank[0] = 0;
		this._left = new Array(capacity+1).fill(0, 0, this.n+1);
		this._right = new Array(capacity+1).fill(0, 0, this.n+1);
	}

	get _capacity() { return this._key.length-1; }

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(capacity);
	}
	
	/** Assign a new value by copying from another heap.
	 *  @param lh is another Lheaps object
	 */
	assign(lh) {
		if (lh == this) return;
		if (lh.n > this.n) this.reset(lh.n);
		else { this.clear(); this._n = lh.n; }
		for (let i = 1; i <= lh.n; i++) {
			this._key[i] = lh._key[i]; this._rank[i] = lh._rank[i];
			this._left[i] = lh._left[i]; this._right[i] = lh._right[i];
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(lh) {
		if (lh == this) return;
		this._n = lh.n;
		this._key = lh._key; this._rank = lh._rank;
		this._left = lh._left; this._right = lh._right;
		lh._key = lh._rank = lh._left = lh._right = null;
	}
	
	/** Expand the space available for this Lheaps.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Lheaps(this.n,
								Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this);
			this.xfer(nu);
		}
		this._key.fill(0, this.n+1, n+1);
		this._rank.fill(1, this.n+1, n+1);
		this._left.fill(0, this.n+1, n+1);
		this._right.fill(0, this.n+1, n+1);
		this._n = n;
	}

	/** Revert to initial state. */
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this._key[i] = this._left[i] = this._right[i] = 0;
			this._rank[i] = 1;
		}
	}

	/** Return key of a heap item. */
	key(i) { return this._key[i]; }

	/** Return rank of a heap item. */
	rank(i) { return this._rank[i]; }

	/** Return left child of a heap item. */
	left(i) { return this._left[i]; }

	/** Return a right child of a heap item. */
	right(i) { return this._right[i]; }

	/** Set the key of a heap item.
	 *  @param i is a heap item, assumed to be root of a singleton heap
	 *  @param k is new key value for i
	 */
	setkey(i, k) { this._key[i] = k; }

	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) { return h; }

	/** Combine a list of heaps into a single heap.
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

	meld(h1, h2) {
		// relies on null node having rank==0
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
		if (this.key(h1) > this.key(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
		this._right[h1] = this.meld(this.right(h1), h2);
		if (this.rank(this.left(h1)) < this.rank(this.right(h1))) {
			let h = this.left(h1);
			this._left[h1] = this.right(h1);
			this._right[h1] = h;
		}
		this._rank[h1] = this.rank(this.right(h1)) + 1;
		return h1;
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton.
	 *  @param h is a heap to which i is inserted.
	 *  @param k is the key under which i is inserted
	 */
	insert(i, h, k) {
		let mx = Math.max(i, h);
		if (mx > this.n) this.expand(mx);
		assert((i == 0 || this.valid(i)) && (h == 0 || this.valid(h)));
		assert(this.left(i) == 0 && this.right(i) == 0 && this.rank(i) == 1);
		this.setkey(i, k);
		return this.meld(i, h);
	}

	/** Remove the item with smallest key from a heap.
	 *  @param h is the canonical element of some heap
	 *  @return the canonical element of the resulting heap
	 */
	deletemin(h) {
		assert(this.valid(h));
		let h1 = this.meld(this.left(h),this.right(h));
		this._left[h] = this._right[h] = 0; this._rank[h] = 1;
		return h;
	}
	
	/** Determine if two Lheaps objects are equal.
	 *  @param h is another Lheaps to be compared to this, or a string
	 *  representing an Lheaps object.
	 *  @return if h is an Lheaps, return true if the heaps in both contain
	 *  the same items with the same keys; if h is a string, compare the
	 *  the string representation of this to h; otherwise, return false
	 */
	equals(lh) {
		if (this === lh) return true;
		if (typeof lh == 'string') {
			let s = lh; lh = new Lheaps(this.n); lh.fromString(s);
		}
		if (!(lh instanceof Lheaps) || this.n != lh.n)
			return false;
		// check that keys match
		for (let i = 1; i <= this.n; i++) {
			if (this.key(i) != lh.key(i)) return false;
		}
		// construct Dsets objects whose subsets match heaps
		// then check these for equality
		let ds1 = new Dsets(this.n); let ds2 = new Dsets(lh.n);
		for (let i = 1; i <= this.n; i++) {
			if (this.left(i) != 0 && ds1.find(i) != ds1.find(this.left(i)))
				ds1.link(ds1.find(i), ds1.find(this.left(i)));
			if (this.right(i) != 0 && ds1.find(i) != ds1.find(this.right(i)))
				ds1.link(ds1.find(i), ds1.find(this.right(i)));
			if (lh.left(i) != 0 && ds2.find(i) != ds2.find(lh.left(i)))
				ds2.link(ds2.find(i), ds2.find(lh.left(i)));
			if (lh.right(i) != 0 && ds2.find(i) != ds2.find(lh.right(i)))
				ds2.link(ds2.find(i), ds2.find(lh.right(i)));
		}
		return ds1.equals(ds2);
	}

	/** Construct a string representation of this object.
	 *  @return the string
	 */
	toString(details=false, pretty=false, strict=false) {
		let s = "";
		let isroot = new Array(this.n+1).fill(true);
		for (let i = 1; i <= this.n; i++)
			isroot[this.left(i)] = isroot[this.right(i)] = false;
		for (let i = 1; i <= this.n; i++) {
			if (!isroot[i]) continue;
			let ss = this.heap2string(i, details, pretty, strict);
			if (s.length > 0 && ss.length > 0)
				s += pretty ? '\n' : ' ';
			s += ss;
		}
		return pretty ? '{\n' + s + '\n}' : '{' + s + '}';
	}
	
	/** Recursive helper for constructing a string representation of a heap.
	 *  @param h is a node in one of the trees of the heap
	 *  @param isroot is true if h is the canonical element of the heap
	 *  @return the string
	 */
	heap2string(h, details=false, pretty=false, strict=false, isroot=true) {
		if (h == 0) return '';
		let s = '';
		if (this.left(h) == 0 && this.right(h) == 0) {
			s += this.index2string(h, strict) + ":" + this.key(h);
			if (details) s +=  ":" + this.rank(h);
			return isroot ? '(' + s + ')' : s;
		}
		if (this.left(h) == 0) {
			if (details) s += '- ';
		} else {
			 s += this.heap2string(this.left(h), details,pretty,strict,false)
				  + ' ';
		}
		if (isroot && details) s += "*";
		s += this.index2string(h, strict) + ":" + this.key(h);
		if (details) s +=  ":" + this.rank(h);
		if (this.right(h) == 0) {
			if (details) s += ' -';
		} else {
			 s += ' ' +
				  this.heap2string(this.right(h), details,pretty,strict,false);
		}
		return (isroot || details) ? '(' + s + ')' : s;
	}

	/** Initialize this Lheaps object from a string.
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
				if (i > this.n) this.expand(i);
				if (!sc.verify(':')) { this.clear(); return false; }
				let key = sc.nextNumber();
				if (isNaN(key)) { this.clear(); return false; }
				if (i != h) h = this.insert(i, h, key);
				else this.setkey(h, key);
			}
			if (!sc.verify(')')) { this.clear(); return false; }
		}
		if (!sc.verify('}')) { this.clear(); return false; }
		return true;
	}
}
