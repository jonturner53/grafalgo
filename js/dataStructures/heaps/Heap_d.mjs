/** @file Heap_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../Errors.mjs';
import Adt from '../Adt.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a heap data structure.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when a heap object is constructed.
 */
export default class Heap_d extends Adt {
	#d;			///< base of heap
	#m;			///< # of items in the heap set

	#hs;			///< {#hs[1],...,#hs[m]} is the items in the heap
	#pos;		///< #pos[i] gives position of i in #hs
	#key;		///< #key[i] is key of item i

	/** Constructor for Heap_d object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 2)
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, d=2, capacity=n) { super(n); this.#init(d, capacity); }
	
	/** Allocate space and initialize Heap_d object.
	 *  @param nMax is the maximum range
	 *  @param d is the base of the heap.
	 */
	#init(d, capacity) {
		this.#hs = new Array(capacity+1);
		this.#pos = new Array(capacity+1).fill(0);
		this.#key = new Array(capacity+1);
		this.#hs[0] = this.#m = 0; this.#d = d;
	}

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param nMax the new max range.
	 *  Wparam d is the new base of the heap.
	 */
	reset(n, d=2, capacity=n) {
		assert(capacity >= n); this._n = n; this.#init(d, capacity);
	}
	
	/** Assign a new value by copying from another heap.
	 *  @param h is another heap
	 */
	assign(h) {
		if (h == this) return;
		if (h.n > this.n) { reset(h.n, h.d); }
		else { clear(); this._n = h.n; }

		this.m = h.m;
		for (p = 1; p <= h.m; p--) {
			x = h.#hs[p];
			this.#hs[p] = x; this.#pos[x] = p; this.#key[x] = h.#key[x];
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	xfer(h) {
		if (h == this) return;
		if (!(h instanceof Heap_d)) return;
		this.#d = h.#d; this.#m = h.#m;
		this.#hs = h.hs; this.#pos = h.pos; this.#key = h.#key;
		h.hs = h.pos = h.Key = null;
	}
	
	/** Expand the space available for this Heap_d.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */
	expand(n) {
		if (n <= this.n) return;
		if (n > this._capacity) {
			let nu = new Heap_d(this.n, this.#d,
							    Math.max(n, Math.floor(1.25 * this._capacity)));
			nu.assign(this); this.xfer(nu);
		}
		this.#pos.fill(0, this.n+1, n+1);
		this._n = n;
	}

	/** Remove all elements from heap. */
	clear() {
		for (let x = 1; x <= this.#m; x++) this.#pos[this.#hs[x]] = 0;
		this.#m = 0;
	}

	/** Return parent of a node. */
	#p(x) { return Math.floor((x+(this.#d-2))/this.#d); }

	/** Return leftmost child of a node. */
	#left(x) { return this.#d*(x-1)+2; }

	/** Return rightmost child of a node. */
	#right(x) { return this.#d*x+1; }

	get _capacity() { return this.#hs.length-1; }

	get m() { return this.#m; }
	
	/** Find an int in the heap with the smallest key.
	 *  @return the number of an int that has the smallest key
	 */
	findmin() { return this.empty() ? 0 : this.#hs[1]; }
	
	/** Delete a minimum key int from the heap and return it.
	 *  @return an int of minimum key from the heap, after deleting it
	 *  from the heap
	 */
	deletemin() {
		if (this.empty()) return 0;
		let i = this.#hs[1]; this.delete(this.#hs[1]);
		return i;
	}
	
	/** Get the key of an item.
	 *  @param i is an item in the heap
	 *  @return the value of i's key
	 */
	key(i) { return this.#key[i]; }
	
	/** Determine if an item is in the heap.
	 *  @param i is an item
	 *  @return true if i is in the heap, else false
	 */
	contains(i) { return this.#pos[i] != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	empty() { return this.#m == 0; };
	
	/** Add index to the heap.
	 *  @param i is an index that is not in the heap
	 *  @param key is the key value under which i is to be inserted
	 */
	insert(i, key) {
		assert(i > 0);
		if (i > this._capacity) this.expand(i);
		this.#key[i] = key; this.#m++; this.#siftup(i, this.m);
	}
	
	/** Remove an index from the heap.
	 *  @param i is an index in the heap
	 */
	delete(i) {
		assert(i > 0);
		let j = this.#hs[this.#m--];
		if (i != j) {
			if (this.#key[j] <= this.#key[i])
				this.#siftup(j, this.#pos[i]);
			else
				this.#siftdown(j, this.#pos[i]);
		}
		this.#pos[i] = 0;
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an index to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	#siftup(i, x) {
		let px = this.#p(x);
		while (x > 1 && this.#key[i] < this.#key[this.#hs[px]]) {
			this.#hs[x] = this.#hs[px]; this.#pos[this.#hs[x]] = x;
			x = px; px = this.#p(x);
		}
		this.#hs[x] = i; this.#pos[i] = x;
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an index to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	#siftdown(i, x) {
		let cx = this.#minchild(x);
		while (cx != 0 && this.#key[this.#hs[cx]] < this.#key[i]) {
			this.#hs[x] = this.#hs[cx]; this.#pos[this.#hs[x]] = x;
			x = cx; cx = this.#minchild(x);
		}
		this.#hs[x] = i; this.#pos[i] = x;
	}
	
	/** Find the position of the child with the smallest key.
	 *  This is a private helper function, used by siftdown.
	 *  @param x is a position of an index in the heap
	 *  @return the position of the child of the int at x, that has
	 *  the smallest key
	 */
	#minchild(x) {
		let minc = this.#left(x);
		if (minc > this.m) return 0;
		for (let y = minc + 1; y <= this.#right(x) && y <= this.m; y++) {
			if (this.#key[this.#hs[y]] < this.#key[this.#hs[minc]])
				minc = y;
		}
		return minc;
	}
	
	/** Change the key of an item in the heap.
	 *  @param i is an item in the heap
	 *  @param k is a new key value for item i
	 */
	changekey(i, k) {
		let ki = this.#key[i]; this.#key[i] = k;
		if (k == ki) return;
		if (k < ki) this.#siftup(i, this.#pos[i]);
		else this.#siftdown(i, this.#pos[i]);
	}

	/** Determine if two heaps are equal.
	 *  @param h is a heap to be compared to this
	 *  @return true if both heap sets contain the same items with the
	 *  the same keys; otherwise, return false
	 */
	equals(h) {
		if (this == h) return true;
		if (typeof h == 'string') return this.toString() == h;
		if (!(h instanceof Heap_d)) return false;
		if (this.m != h.m) return false;
		for (let i = 1; i <= this.#m; i++) {
			let x = this.#hs[i];
			if (!h.contains(x) || this.key(x) != h.key(x)) return false;
			let y = h.#hs[i];
			if (!this.contains(y) || this.key(y) != h.key(y)) return false;
		}
		return true;
	}
	
	/** Construct a string representation of this object.
	 *  @param s is a string in which the result is returned
	 *  @return the string
	 */
	toString() {
		let s = '';
		for (let i = 1; i <= this.m; i++) {
			if (i > 1) s += ' ';
			s += this.index2string(this.#hs[i]) + ':' + this.#key[this.#hs[i]];
		}
		return '{' + s + '}';
	}

	/** Initialize this Heap_d object from a string.
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
			let key = sc.nextFloat();
			if (isNaN(key)) { this.clear(); return false; }
			this.insert(i, key);
			i = sc.nextIndex();
		}
		if (!sc.verify('}')) { this.clear(); return false; }
		return true;
	}
}
