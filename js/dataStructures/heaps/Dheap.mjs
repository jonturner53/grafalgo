/** @file Dheap.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Adt from '../Adt.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a heap data structure.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when a heap object is constructed.
 */
export default class Dheap extends Adt {
	_d;			///< base of heap
	_m;			///< # of items in the heap set

	_item;		///< {_item[1],...,_item[m]} is the items in the heap
	_pos;		///< _pos[i] gives position of i in _item
	_key;		///< _key[i] is key of item i

	_insertCount;		// calls to insert
	_deleteCount;		// calls to delete
	_changekeyCount;	// calls to changekey
	_siftupSteps;		// steps taken by siftup
	_siftdownSteps;		// steps taken by siftdown

	/** Constructor for Dheap object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 4)
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, d=4, capacity=n) { super(n); this.#init(d, capacity); }
	
	/** Allocate space and initialize Dheap object.
	 *  @param d is the base of the heap.
	 *  @param capacity is the maximum range
	 */
	#init(d, capacity) {
		this._item = new Array(capacity+1);
		this._pos = new Array(capacity+1).fill(0);
		this._key = new Array(capacity+1);
		this._item[0] = this._m = 0; this._d = d;

		this.clearStats();
	}

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param d is the new base of the heap.
	 *  @param capacity the new max range.
	 */
	reset(n, d=4, capacity=n) {
		assert(capacity >= n); this._n = n; this._init(d, capacity);
	}
	
	/** Assign a new value by copying from another heap.
	 *  @param h is another heap
	 */
	assign(h) {
		if (h == this) return;
		if (h.n > this.n) { reset(h.n, h.d); }
		else { clear(); this._n = h.n; }

		this.m = h.m;
		for (p = 1; p <= h.m; p++) {
			x = h._item[p];
			this._item[p] = x; this._pos[x] = p; this._key[x] = h._key[x];
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(h) {
		if (h == this) return;
		if (!(h instanceof Dheap)) return;
		this._d = h._d; this._m = h._m;
		this._item = h._item; this._pos = h._pos; this._key = h._key;
		h._item = h._pos = h._key = null;
		this.clearStats();
	}
	
	/** Expand the space available for this Dheap.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Dheap(this.n, this._d,
							    Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this._pos.fill(0, this.n+1, n+1);
		this._n = n;
	}

	/** Remove all elements from heap. */
	clear() {
		for (let x = 1; x <= this._m; x++) this._pos[this._item[x]] = 0;
		this._m = 0;
		this.clearStats();
	}

	clearStats() {
		this._insertCount = this._deleteCount = this._changekeyCount = 0
		this._siftupSteps = this._siftdownSteps = 0
	}

	get _capacity() { return this._item.length-1; }

	get d() { return this._d; }

	get m() { return this._m; }

	/** Return position of parent of a heap item.
	 *  @param p is position of item in heap
	 *  @param return position where parent would go if there were one
	 */
	_p(pos) { return Math.ceil((pos-1)/this.d); }

	/** Return position of leftmost child of a heap item.
	 *  @param pos is position of item in heap
	 *  @param return position where left child would go if there were one
	 */
	_left(pos) { return this.d*(pos-1)+2; }

	/** Return position of rightmost child of a heap item.
	 *  @param pos is position of item in heap
	 *  @param return position where right child would go if there were one
	 */
	_right(pos) { return this.d*pos+1; }
	
	/** Find an item in the heap with the smallest key.
	 *  @return the number of an item that has the smallest key
	 */
	findmin() { return this.empty() ? 0 : this._item[1]; }
	
	/** Delete a minimum key item from the heap and return it.
	 *  @return an item of minimum key from the heap, after deleting it
	 *  from the heap
	 */
	deletemin() {
		if (this.empty()) return 0;
		let i = this._item[1]; this.delete(i);
		return i;
	}
	
	/** Get the key of an item.
	 *  @param i is an item in the heap
	 *  @return the value of i's key
	 */
	key(i) { return this._key[i]; }
	
	/** Determine if an item is in the heap.
	 *  @param i is an item
	 *  @return true if i is in the heap, else false
	 */
	contains(i) { return this._pos[i] != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	empty() { return this.m == 0; };
	
	/** Add index to the heap.
	 *  @param i is an index that is not in the heap
	 *  @param key is the key value under which i is to be inserted
	 */
	insert(i, key) {
		assert(i > 0);
		this._insertCount++;
		if (i > this._capacity) this.expand(i);
		this._key[i] = key; this._m++; this._siftup(i, this.m);
	}
	
	/** Remove an index from the heap.
	 *  @param i is an index in the heap
	 */
	delete(i) {
		assert(i > 0);
		this._deleteCount++;
		let j = this._item[this._m--];
		if (i != j) {
			if (this._key[j] <= this._key[i])
				this._siftup(j, this._pos[i]);
			else
				this._siftdown(j, this._pos[i]);
		}
		this._pos[i] = 0;
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	_siftup(i, x) {
		let px = this._p(x);
		while (x > 1 && this._key[i] < this._key[this._item[px]]) {
			this._item[x] = this._item[px]; this._pos[this._item[x]] = x;
			x = px; px = this._p(x);
			this._siftupSteps++;
		}
		this._item[x] = i; this._pos[i] = x;
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
 	 *  @param x is a tentative position for i in the heap
 	 */
	_siftdown(i, x) {
		let cx = this._minchild(x);
		while (cx != 0 && this._key[this._item[cx]] < this._key[i]) {
			this._item[x] = this._item[cx]; this._pos[this._item[x]] = x;
			x = cx; cx = this._minchild(x);
		}
		this._item[x] = i; this._pos[i] = x;
	}
	
	/** Find the position of the child with the smallest key.
	 *  This is a private helper function, used by siftdown.
	 *  @param x is a position of an index in the heap
	 *  @return the position of the child of the item at x, that has
	 *  the smallest key
	 */
	_minchild(x) {
		let minc = this._left(x);
		if (minc > this.m) return 0;
		for (let y = minc + 1; y <= this._right(x) && y <= this.m; y++) {
			this._siftdownSteps++;
			if (this._key[this._item[y]] < this._key[this._item[minc]])
				minc = y;
		}
		return minc;
	}
	
	/** Change the key of an item in the heap.
	 *  @param i is an item in the heap
	 *  @param k is a new key value for item i
	 */
	changekey(i, k) {
		this._changekeyCount++;
		let ki = this._key[i]; this._key[i] = k;
		if (k == ki) return;
		if (k < ki) this._siftup(i, this._pos[i]);
		else this._siftdown(i, this._pos[i]);
	}

	/** Determine if two heaps are equal.
	 *  @param h is a heap to be compared to this
	 *  @return true if both heap sets contain the same items with the
	 *  the same keys; otherwise, return false
	 */
	equals(h) {
		if (this === h) return true;
		if (typeof h == 'string') {
			let s = h; h = new Dheap(this.n); h.fromString(s);
		}
		if (!(h instanceof Dheap)) return false;
		if (this.m != h.m) return false;
		for (let i = 1; i <= this.m; i++) {
			let x = this._item[i];
			if (!h.contains(x) || this.key(x) != h.key(x)) return false;
			let y = h._item[i];
			if (!this.contains(y) || this.key(y) != h.key(y)) return false;
		}
		return true;
	}
	
	/** Produce a string representation of the heap.
	 *  @param details is a flag that (when true) causes implementation
	 *  details to be shown.
	 *  @param pretty is a flag that (when true) produces a more readable
	 *  representation
	 *  @param strict is a flag that forces items to always be shown as
	 *  numerical values, not letters.
	 *  @param u is intended only for recursive calls to toString; it
	 *  identifies a position in the heap structure
	 */
	toString(details=0, pretty=0, strict=0, u=1) {
		if (this.empty()) return '{}';
		if (u == 0) return '';
		let s = this.index2string(this._item[u], strict) +
				':' + this.key(this._item[u]);
		if (this._left(u) <= this.m)
			s += (details ? '(' : ' ');
		for (let v = this._left(u); v <= this._right(u) && v <= this.m; v++) {
			if (v != this._left(u)) s += ' ';
			s += this.toString(details, strict, pretty, v);
		}
		if (details && this._left(u) <= this.m) s += ')';
		return (u == 1 ? '{' + s + '}' : s);
	}

	/** Initialize this Dheap object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('{')) return false;
		let i = sc.nextIndex();
		while (i != 0) {
			if (!sc.verify(':')) { this.clear(); return false; }
			let key = sc.nextNumber();
			if (isNaN(key)) { this.clear(); return false; }
			this.insert(i, key);
			i = sc.nextIndex();
		}
		if (!sc.verify('}')) { this.clear(); return false; }
		return true;
	}

	/** Return statistics object. */
	getStats() {
		return {
			'insert' : this._insertCount, 'delete' : this._deleteCount,
			'changekey' : this._changekeyCount,
			'siftup' : this._siftupSteps, 'siftdown' : this._siftdownSteps
		};
	}
}
