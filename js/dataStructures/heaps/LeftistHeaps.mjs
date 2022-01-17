/** @file LeftistHeaps.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Sets from '../basic/Sets.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a data structure consisting of a disjoint
 *  set of leftist heaps.
 */
export default class LeftistHeaps extends Top {
	#key;		///< #key[i] is key of item i
	#rank;		///< #rank[i] gives rank of item i
	#left;		///< #left[i] is left child of i
	#right;		///< #right[i] is right child of i

	#dummy;		///< is first node in list of unused dummy nodes
	#retired;	///< #retired is either a user-supplied function
				///< or an array of bits
	#plist;		///< temporary list used by purge
	#lazy		///< when true, implements lazy deletion/melding

    #insertCount;       // calls to insert
    #deleteCount;       // calls to deletemin
    #meldSteps;		    // steps in non-lazy meld
    #purgeSteps;

	/** Constructor for LeftistHeaps object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param capacity is maximum index range (defaults to n)
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired.
	 */
	constructor(n, capacity=n, lazy=false, retired=null) {
		super(n); 
		if (!capacity) capacity = this.n;
		this.#init(capacity, lazy, retired);
	}
	
	/** Allocate space and initialize LeftistHeaps object.
	 *  @param capacity is the maximum range
	 *  @param retired is an optional function that if present is used
	 *  to determine which nodes are retired; if null, nodes
	 *  must be retired explicitly.
	 */
	#init(capacity, lazy, retired) {
		assert(capacity >= this.n);

		if (lazy) {
			this.#key = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
			this.#left = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
			this.#right = new Array(2*capacity+1).fill(0, 0, 2*this.n+1);
			this.#rank = new Array(2*capacity+1).fill(1, 1, this.n+1);
			this.#rank.fill(-1, this.n+1, 2*this.n+1);  // mark unused dummy
			this.#rank[0] = 0;
			if (retired != null) this.#retired = retired;
			else this.#retired = new Array(capacity+1).fill(false);
			// link unused dummy nodes into a free list
			this.#dummy = this.n+1;
			for (let i = this.n+1; i < 2*this.n; i++) this.#left[i] = i+1;
			this.#left[2*this.n] = 0;
		} else {
			this.#key = new Array(capacity+1).fill(0, 0, this.n+1);
			this.#left = new Array(capacity+1).fill(0, 0, this.n+1);
			this.#right = new Array(capacity+1).fill(0, 0, this.n+1);
			this.#rank = new Array(capacity+1).fill(1, 1, this.n+1);
			this.#rank[0] = 0;
		}
		this.#lazy = lazy;
		this.#plist = new List(this.n);
	    this.#insertCount = 0;
	    this.#deleteCount = 0;
	    this.#meldSteps = 0;
	    this.#purgeSteps = 0;
	}

	makeLazy(retired) {
		let nu = new LeftistHeaps(this.n, this.n, true, retired);
		nu.assign(this); this.xfer(nu);
	}

	get capacity() { return (this.#lazy ? (this.#key.length-1)/2 :
										   this.#key.length-1); }

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=0, lazy=false, retired=null) {
		this._n = n;
		if (capacity == 0) capacity = this.n;
		this.#init(capacity, lazy, retired);
	}
	
	/** Assign a new value by copying from another heap.
	 *  @param lh is another LeftistHeaps object
	 */
	assign(lh) {
		if (lh == this) return;
		if (lh.n > this.capacity) this.reset(lh.n);
		else { this.clear(); this._n = lh.n; }
		if (lh.#lazy) this.makeLazy();

		let roots = lh.#findRoots(); let heaps = this.#heapLists(lh);
		let l = new List(lh.n);
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			for (let i = r; i != 0; i = heaps.next(i)) {
				this.setkey(i, lh.key(i)); l.enq(i);
			}
			this.heapify(l); l.clear();
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(lh) {
		if (lh == this) return;
		this._n = lh.n; this.#lazy = lh.#lazy;
		this.#key = lh.#key; this.#rank = lh.#rank;
		this.#left = lh.#left; this.#right = lh.#right;
		lh.#key = lh.#rank = lh.#left = lh.#right = null;
		if (this.#lazy) {
			this.#dummy = lh.#dummy;
			this.#retired = lh.#retired; lh.#retired = null;
		}
	}
	
	/** Expand the space available for this LeftistHeaps.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		this.#clearDummy();
		if (n <= this.n) return;
		if (n > this.capacity) {
			let nu = new LeftistHeaps(this.n,
						Math.max(n, Math.floor(1.25 * this.capacity)),
						this.#lazy,
						Array.isArray(this.#retired) ? null : this.#retired);
			nu.assign(this);
			this.xfer(nu);
		}
		if (this.#lazy) {
			this.#key.fill(0, this.n+1, 2*n+1);
			this.#left.fill(0, this.n+1, 2*n+1);
			this.#right.fill(0, this.n+1, 2*n+1);
			this.#rank.fill(1, this.n+1, n+1);
			this.#rank.fill(-1, n+1, 2*n+1);
			this.#retired.fill(false, this.n+1, n+1);
			this._n = n;
			// rebuild dummy list
			this.#dummy = this.n+1;
			for (let i = this.n+1; i < 2*this.n; i++) this.#left[i] = i+1;
			this.#left[2*this.n] = 0;
		} else {
			this.#key.fill(0, this.n+1, n+1);
			this.#left.fill(0, this.n+1, n+1);
			this.#right.fill(0, this.n+1, n+1);
			this.#rank.fill(1, this.n+1, n+1);
			this._n = n;
		}
		this.#plist.expand(this.n);
	}

	/** Revert to initial state. */
	clear() {
		let roots = this.#findRoots();
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			while (r != 0) [,r] = this.deletemin(r);
		}
	}

	/** Determine if a node is a dummy.
	 *  @param i is a node index
	 *  @return true if i is a dummy node (possibly in-use)
	 */
	isdummy(i) { return this.#lazy && i > this.n; }

	/** Determine if a node is active.
	 *  @param i is a node index
	 *  @return true if i is neither a dummy, nor a retired item.
	 */
	isactive(i) {
		return (!this.#lazy || i <= this.n && !this.retired(i));
	}

	#clearDummy() {
		if (!this.#lazy) return;
		let roots = this.#findRoots();
		for (let r = roots.first(); r != 0; r = roots.next(r))
			this.findmin(r);
	}

	/** Build a List of heap roots.
	 *  @return a List object containing the roots of all the heaps
	 */
	#findRoots() {
		let roots;
		if (this.#lazy) {
			roots = new List(2*this.n);
			for (let i = 1; i <= 2*this.n; i++) roots.enq(i);
			for (let i = 1; i <= 2*this.n; i++) {
				if (this.#rank[i] < 0) {
					roots.delete(i); continue;
				}
				if (this.left(i) != 0 && roots.contains(this.left(i)))
					roots.delete(this.left(i));
				if (this.right(i) != 0 && roots.contains(this.right(i)))
					roots.delete(this.right(i));
			}
		} else {
			roots = new List(this.n);
			for (let i = 1; i <= this.n; i++) roots.enq(i);
			for (let i = 1; i <= this.n; i++) {
				if (this.left(i) != 0 && roots.contains(this.left(i)))
					roots.delete(this.left(i));
				if (this.right(i) != 0 && roots.contains(this.right(i)))
					roots.delete(this.right(i));
			}
		}
		return roots;
	}

	valid(i) {
		return i > 0 && (i <= this.n || (i <= 2*this.n && this.#rank[i] >= 0));
	}

	/** Return key of a heap item. */
	key(i) { return this.#key[i]; }

	/** Return rank of a heap item. */
	rank(i) { return this.#rank[i]; }

	/** Return left child of a heap item. */
	left(i) { return this.#left[i]; }

	/** Return a right child of a heap item. */
	right(i) { return this.#right[i]; }

	/** Set the key of a heap item.
	 *  @param i is a heap item, assumed to be root of a singleton heap
	 *  @param k is new key value for i
	 */
	setkey(i, k) { this.#key[i] = k; }

	/** Retire a heap item.
	 *  Retired heap items do not belong to any heap and cannot be
	 *  used in the future.
	 *  @param i is a heap item to be retired.
	 */
	retire(i) {
		if (!this.#lazy) this.makeLazy();
		if (Array.isArray(this.#retired)) this.#retired[i] = true;
	}

	/** Determine if a heap item is retired.
	 *  @param i is a heap item
	 *  @return true if i has been retired (either explicitly or implicitly
	 *  through user-provided retired function)
	 */
	retired(i) {
		if (!this.#lazy) return false;
		return i <= this.n && (Array.isArray(this.#retired) ?
				   			   this.#retired[i] : this.#retired(i));
	}

	/** Meld two heaps.
	 *  @param h1 is a heap
	 *  @param h2 is a second heap
	 *  @return the identifier of the resulyt of melding h1 and h2
	 */
	meld(h1, h2) {
		this.#meldSteps++;
		// relies on null node having rank==0
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
		if (this.key(h1) > this.key(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
		this.#right[h1] = this.meld(this.right(h1), h2);
		if (this.rank(this.left(h1)) < this.rank(this.right(h1))) {
			let h = this.left(h1);
			this.#left[h1] = this.right(h1);
			this.#right[h1] = h;
		}
		this.#rank[h1] = this.rank(this.right(h1)) + 1;
		return h1;
	}

	/** Insert item into a heap. 
	 *  @param i is a singleton.
	 *  @param h is a heap to which i is inserted.
	 *  @param k is the key under which i is inserted
	 */
	insert(i, h, k) {
		this.#insertCount++;
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
    	this.#plist.clear();
		this.#purge(h);
		return this.heapify(this.#plist);
	}

	/** Remove the item with smallest key from a heap.
	 *  @param h is a heap
	 *  @return the pair [hmin, hnew] where hmin is the deleted
	 *  item and hnew is the modified heap
	 */
	deletemin(h) {
		this.#deleteCount++;
		let hmin;
		if (this.#lazy) {
			hmin = h = this.findmin(h);
			h = this.lazyMeld(this.left(h), this.right(h));
		} else {
			hmin = h;
			h = this.meld(this.left(h), this.right(h));
		}
		this.#left[hmin] = this.#right[hmin] = 0; this.#rank[hmin] = 1;
		return [hmin,h];
	}

	/** Remove deleted items from the top of a heap and construct list
	 *  of subheaps with non-deleted roots.
	 *  @param h is a heap to be purged
	 */
	#purge(h) {
	    if (h == 0) return;
		this.#purgeSteps++;
	    assert(this.valid(h));
	    if (this.isactive(h)) {
	        this.#plist.enq(h);
	    } else {
	        this.#purge(this.left(h)); this.#purge(this.right(h));
	        if (this.isdummy(h)) {
	            this.#left[h] = this.#dummy; this.#dummy = h;
				this.#rank[h] = -1;
	        } else {
	            this.#left[h] = this.#right[h] = 0; this.#rank[h] = 0;
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
		if (!this.#lazy) this.makeLazy();
		if (h1 == 0) return h2;
		if (h2 == 0) return h1;
	    assert((h1 == 0 || this.valid(h1)) &&
			   (h2 == 0 || this.valid(h2)) && this.#dummy != 0);
	    let d = this.#dummy; this.#dummy = this.#left[this.#dummy];
		if (this.rank(h1) < this.rank(h2)) {
			let h = h1; h1 = h2; h2 = h;
		}
	    this.#left[d] = h1; this.#right[d] = h2;
		this.#rank[d] = this.rank(h2) + 1;
		this.#key[d] = Number.NEGATIVE_INFINITY;
	    return d;
	}
	
	/** Determine if two LeftistHeaps objects are equal.
	 *  @param lh is another LeftistHeaps to be compared to this, or a string
	 *  representing an LeftistHeaps object.
	 *  @return if lh is an LeftistHeaps, return true if the heaps in both contain
	 *  the same items with the same keys; if lh is a string, compare the
	 *  the string representation of this to lh; otherwise, return false
	 */
	equals(lh) {
		if (this === lh) return true;
		if (typeof lh == 'string') {
			let s = lh; lh = new LeftistHeaps(this.n); lh.fromString(s);
		}
		if (!(lh instanceof LeftistHeaps) || this.n != lh.n)
			return false;
		// check that keys and retired status match
		for (let i = 1; i <= this.n; i++) {
			if (this.retired(i) != lh.retired(i)) return false;
			if (!this.retired(i) && this.key(i) != lh.key(i)) return false;
		}
		let ss1 = new Sets(); ss1.assign(this.#heapLists(this));
		let ss2 = new Sets(); ss2.assign(this.#heapLists(lh));
		return ss1.equals(ss2);
	}

	/** Create a ListSet object with a distinct list of items for each heap
	 *  in a LeftistHeaps object.
	 *  @param lh is a LeftistHeaps object
	 *  @return a ListSet object that lists the items in each heap separately,
	 *  with each heap's root at the start of its list
	 */
	#heapLists(lh) {
		let roots = lh.#findRoots();
		// for each heap in lh, do tree traversal to build set in ls
		let ls = new ListSet(lh.n);
		let q = new List(this.#lazy ? 2*lh.n : lh.n);
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			let first = 0;
			q.clear(); q.enq(r);
			while (!q.empty()) {
				let i = q.deq();
				if (lh.isactive(i) && i != r) ls.join(r, i);
				if (lh.left(i) != 0)  q.enq(lh.left(i));
				if (lh.right(i) != 0) q.enq(lh.right(i));
			}
		}
		return ls;
	}

	/** Construct a string representation of this object.
	 *  @return the string
	 */
	toString(details=false, pretty=false, label) {
		let s = "";
		let roots = this.#findRoots();
		for (let r = roots.first(); r != 0; r = roots.next(r)) {
			let ss = this.heap2string(r, details, pretty, label);
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
	heap2string(h, details=false, pretty=false, label, isroot=true) {
		if (h == 0) return '';
		let s = '';
		if (this.left(h) == 0 && this.right(h) == 0) {
			s += !this.isactive(h) ? (details ? '-' : '') :
				 		this.index2string(h, label) + ":" + this.key(h);
			if (details) s +=  ":" + this.rank(h);
			return isroot && s.length > 0 ? '(' + s + ')' : s;
		}
		let ls = this.heap2string(this.left(h), details,pretty,label,false);
		let rs = this.heap2string(this.right(h), details,pretty,label,false);
		let cs = (!this.isactive(h) ? (details ? '-' : '') :
							this.index2string(h, label) + ":" + this.key(h));
		if (details)
			cs = (isroot ? '*' : '') + cs +  ":" + this.rank(h);
		if (ls.length > 0) {
			s += ls;
		} if (cs.length > 0) {
			if (ls.length > 0) s += ' ';
			s += cs;
		}
		if (rs.length > 0) {
			if (ls.length > 0 || cs.length > 0) s += ' ';
			s += rs;
		}
		return (isroot || details) ? '(' + s + ')' : s;
	}

	/** Initialize this LeftistHeaps object from a string.
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
		return { 'insert' : this.#insertCount,
				 'delete' : this.#deleteCount,
				 'meld' : this.#meldSteps,
				 'purge' : this.#purgeSteps };
	}
}
