/** @file Lheaps_l.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Adt from '../Adt.mjs';
import List from '../basic/List.mjs';
import List_d from '../basic/List_d.mjs';
import Dsets from '../basic/Dsets.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of lazy Fibonacci heaps. It does not extend the Lheaps class,
 *  because this version requires twice the space and it is impossible
 *  to extend original without creating implementation-dependencies.
 *
 *  User-visible index range is 1..n, but implementation includes
 *  heap nodes with indices up to 2n. These can visible as heap ids.
 */
export default class Lheaps_l extends Adt {
	_key;		///< _key[i] is key of item i
	_rank;		///< _rank[i] gives rank of item i
	_left;		///< _left[i] is left child of i
	_right;		///< _right[i] is right child of i

	_dummy;		///< is first node in list of unused dummy nodes
	_retired;	///< _retired is either a user-supplied function
				///< or an array of bits
	_plist;		///< temporary list used by purge

    _insertCount;       // calls to insert
    _deleteCount;       // calls to deletemin
    _meldSteps;		    // steps in non-lazy meld
    _purgeSteps;

	/** Constructor for Lheaps object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param capacity is maximum index range (defaults to n)
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired.
	 */
	constructor(n, capacity=n, retired=null) {
		super(n); this.#init(capacity, retired);
	}
	
	/** Allocate space and initialize Lheaps object.
	 *  @param capacity is the maximum range
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired; if null, nodes
	 *  must be retired explicitly.
	 */
	#init(capacity, retired) {
		assert(capacity >= this.n);

		this._key = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
		this._left = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
		this._right = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
		this._rank = new Array(2*capacity+1).fill(1, 1, this.n+1);
		this._rank.fill(-1, this.n+1, 2*this.n+1);  // mark unused dummy nodes
		this._rank[0] = 0;

		if (retired != null) this._retired = retired;
		else this._retired = new Array(capacity+1).fill(false);
		// link unused dummy nodes into a free list
		this._dummy = this.n+1;
		for (let i = this.n+1; i < 2*this.n; i++) this._left[i] = i+1;
		this._left[2*this.n] = 0;

		this._plist = new List(this.n);

	    this._insertCount = 0;
	    this._deleteCount = 0;
	    this._meldSteps = 0;
	    this._purgeSteps = 0;
	}

	get _capacity() { return (this._key.length-1)/2; }

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) { this._n = n; this.#init(capacity); }
	
	/** Assign a new value by copying from another heap.
	 *  @param lh is another Lheaps object
	 */
	assign(lh) {
		if (lh == this) return;
		if (lh.n > this._capacity) this.reset(lh.n);
		else { this.clear(); this._n = lh.n; }
		for (let i = 1; i <= 2*lh.n; i++) {
			this._key[i] = lh._key[i]; this._rank[i] = lh._rank[i];
			this._left[i] = lh._left[i]; this._right[i] = lh._right[i];
		}
		this._dummy = lh._dummy;
		this.retired = lh.retired;
		if (Array.isArray(this.retired)) {
			for (let i = 1; i <= this.n; i++)
				this._retired[i] = lh._retired[i];
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
		this._dummy = lh._dummy; this._retired = lh._retired;
		lh._key = lh._rank = lh._left = lh._right = null;
		lh._retired = null;
	}
	
	/** Expand the space available for this Lheaps.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		this._clearDummy();
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Lheaps_l(this.n,
						Math.max(n, Math.floor(1.25 * this._capacity)),
						Array.isArray(this._retired) ? null : this._retired);
			nu.assign(this);
			this.xfer(nu);
		}
		this._key.fill(0, this.n+1, 2*n+1);
		this._left.fill(0, this.n+1, 2*n+1);
		this._right.fill(0, this.n+1, 2*n+1);
		this._rank.fill(1, this.n+1, n+1); this._rank.fill(-1, n+1, 2*n+1);
		this._retired.fill(false, this.n+1, n+1);
		this._n = n;
		// rebuild dummy list
		this._dummy = this.n+1;
		for (let i = this.n+1; i < 2*this.n; i++) this._left[i] = i+1;
		this._left[2*this.n] = 0;

		this._plist.expand(this.n);
	}

	/** Revert to initial state. */
	clear() {
		let n = this.n;
		this._key.fill(0, 0, 2*n+1);
		this._left.fill(0, 0, 2*n+1);
		this._right.fill(0, 0, 2*n+1);
		this._rank.fill(1, 1, n+1); this._rank.fill(-1, n+1, 2*n+1);
		this._retired.fill(false, 0, n+1);
		// rebuild dummy list
		this._dummy = n+1;
		for (let i = n+1; i < 2*n; i++) this._left[i] = i+1;
		this._left[2*n] = 0;
	}

	/** Determine if a node is a dummy.
	 *  @param i is a node index
	 *  @return true if i is a dummy node (possibly in-use)
	 */
	_isdummy(i) { return i > this.n; }

	/** Determine if a node is active.
	 *  @param i is a node index
	 *  @return true if i represents a node in some non-retired node in
	 *  some heap.
	 */
	_isactive(i) {
		return (i <= this.n && !this.retired(i)) ||
			   (i >  this.n && this._rank[i] >= 0);
	}

	_clearDummy() {
		let roots = this._findRoots();
		for (let r = roots.first(); r != 0; r = roots.next(r))
			this.findmin(r);
	}

	/** Build a List of heap roots.
	 *  @return a List object containing the roots of all the heaps
	 */
	_findRoots() {
		// make list of heap roots
		let roots = new List_d(2*this.n);
		for (let i = 1; i <= 2*this.n; i++) roots.enq(i);
		for (let i = 1; i <= 2*this.n; i++) {
			if (this._rank[i] < 0) {
				roots.delete(i); continue;
			}
			if (this.left(i) != 0 && roots.contains(this.left(i)))
				roots.delete(this.left(i));
			if (this.right(i) != 0 && roots.contains(this.right(i)))
				roots.delete(this.right(i));
		}
		return roots;
	}

	valid(i) {
		return i > 0 && (i <= this.n || (i <= 2*this.n && this._rank[i] >= 0));
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

	/** Retire a heap item.
	 *  Retired heap items do not belong to any heap and cannot be
	 *  used in the future.
	 *  @param i is a heap item to be retired.
	 */
	retire(i) {
		if (Array.isArray(this._retired)) this._retired[i] = true;
	}

	/** Determine if a heap item is retired.
	 *  @param i is a heap item
	 *  @return true if i has been retired (either explicitly or implicitly
	 *  through user-provided retired function)
	 */
	retired(i) {
		return i <= this.n && (Array.isArray(this._retired) ?
				   			   this._retired[i] : this._retired(i));
	}

	/** Meld two heaps.
	 *  @param h1 is a heap
	 *  @param h2 is a second heap
	 *  @return the identifier of the resulyt of melding h1 and h2
	 */
	meld(h1, h2) {
		this._meldSteps++;
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
		this._insertCount++;
		let mx = Math.max(i, h);
		if (mx > this.n) this.expand(mx);
		assert((i == 0 || this.valid(i)) && (h == 0 || this.valid(h)));
		assert(this.left(i) == 0 && this.right(i) == 0 && this.rank(i) == 1);
		this.setkey(i, k);
		return this.meld(i, h);
	}
	
	/** Return the item of minimum key in a heap.
	 *  @param h is a heap.
	 *  @return the item in h that has the smallest key
	 */
	findmin(h) {
    	this._plist.clear();
		this._purge(h);
		return this.heapify(this._plist);
	}

	/** Remove the item with smallest key from a heap.
	 *  @param h is the canonical element of some heap
	 *  @return the canonical element of the resulting heap
	 */
	deletemin(h) {	
		this._deleteCount++;
		let i = this.findmin(h);
		h = this.lazyMeld(this._left[i], this._right[i]);
		this._left[i] = this._right[i] = 0; this._rank[i] = 1;
		return i;
	}

	/** Remove deleted items from the top of a heap and construct list
	 *  of subheaps with non-deleted roots.
	 *  @param h is a heap to be purged
	 */
	_purge(h) {
	    if (h == 0) return;
		this._purgeSteps++;
	    assert(this.valid(h));
	    if (!this._isdummy(h) && !this.retired(h)) {
	        this._plist.enq(h);
	    } else {
	        this._purge(this.left(h)); this._purge(this.right(h));
	        if (this._isdummy(h)) {
	            this._left[h] = this._dummy; this._dummy = h;
				this._rank[h] = -1;
	        } else {
	            this._left[h] = this._right[h] = 0; this._rank[h] = 0;
	        }
	    }
	}

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

	/** Lazy meld a pair of heaps */
	lazyMeld(h1, h2) {
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
	    assert((h1 == 0 || this.valid(h1)) &&
			   (h2 == 0 || this.valid(h2)) && this._dummy != 0);
	    let d = this._dummy; this._dummy = this._left[this._dummy];
		if (this.rank(h1) < this.rank(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
	    this._left[d] = h1; this._right[d] = h2;
		this._rank[d] = this.rank(h2) + 1;
		this._key[d] = Number.NEGATIVE_INFINITY;
	    return d;
	}
	
	/** Determine if two Lheaps_l objects are equal.
	 *  @param lh is another Lheaps_l to be compared to this, or a string
	 *  representing an Lheaps_l object.
	 *  @return if lh is an Lheaps_l, return true if the heaps in both contain
	 *  the same items with the same keys; if lh is a string, compare the
	 *  the string representation of this to lh; otherwise, return false
	 */
	equals(lh) {
		if (this === lh) return true;
		if (typeof lh == 'string') {
			let s = lh; lh = new Lheaps_l(this.n); lh.fromString(s);
		}
		if (!(lh instanceof Lheaps_l) || this.n != lh.n)
			return false;
		// check that keys and retired status match
		for (let i = 1; i <= this.n; i++) {
			if (this.retired(i) != lh.retired(i)) return false;
			if (!this.retired(i) && this.key(i) != lh.key(i)) return false;
		}
		let ds1 = this._heapSets(this);
		let ds2 = this._heapSets(lh);
		return ds1.equals(ds2);
	}

	/** Create a Dsets object with a distinct set of items for each heap
	 *  in a Lheaps_l object.
	 *  @param lh is a leftist heap object
	 *  @return a Dsets object that groups items as they are grouped into heaps;
	 *  the returned object does not include dummy nodes and retired nodes are
	 *  left in singleton sets.
	 */
	_heapSets(lh) {
		let roots = lh._findRoots();
		// for each heap in lh, do tree traversal to build set in ds
		let ds = new Dsets(lh.n); let q = new List(2*lh.n);
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			let first = 0;
			q.clear(); q.enq(r);
			while (!q.empty()) {
				let i = q.deq();
				if (!lh._isdummy(i) && !lh.retired(i)) {
					if (first == 0)
						first = i;
					else if (ds.find(first) != ds.find(i))
						ds.link(ds.find(first), ds.find(i));
				}
				if (lh.left(i) != 0)  q.enq(lh.left(i));
				if (lh.right(i) != 0) q.enq(lh.right(i));
			}
		}
		return ds;
	}

	/** Construct a string representation of this object.
	 *  @return the string
	 */
	toString(details=false, pretty=false, strict=false) {
		let s = "";
		let roots = this._findRoots();
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			let ss = this.heap2string(r, details, pretty, strict);
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
			s += (!this._isdummy(h) && !this.retired(h) ?
					this.index2string(h, strict) + ":" + this.key(h) :
					(details ? '-' : ''));
			if (details) s +=  ":" + this.rank(h);
			return isroot && s.length > 0 ? '(' + s + ')' : s;
		}
		if (this.left(h) == 0) {
			if (details) s += '- ';
		} else {
			 s += this.heap2string(this.left(h), details,pretty,strict,false)
				  + ' ';
		}
		if (isroot && details) s += "*";
		s += (!this._isdummy(h) && !this.retired(h) ?
				this.index2string(h, strict) + ":" + this.key(h) :
				(details ? '-' : ''));
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
		let items = new Set();
		while (sc.verify('(')) {
			let h = sc.nextIndex();
			for (let i = h; i != 0; i = sc.nextIndex()) {
				if (items.has(i) || !sc.verify(':')) {
					this.clear(); return false;
				}
				if (i > this.n) this.expand(i);
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

	getStats() {
		return { 'insert' : this._insertCount,
				 'delete' : this._deleteCount,
				 'meld' : this._meldSteps,
				 'purge' : this._purgeSteps };
	}
}
