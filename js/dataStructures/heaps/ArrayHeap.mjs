/** @file ArrayHeap.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import Forest from '../trees/Forest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class implements a heap data structure.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when a heap object is constructed.
 */
export default class ArrayHeap extends Top {
	D;          // base of heap
	Size;       // # of items in the heap set

	pos;        // pos[i] gives position of i in the heap
	Item;       // Item[x]is the item at position x in the heap
	Key;        // Key[i] is key of item i
	Offset;     // offset for key values, allowing all to shift at once

	changekeys;  // calls to changekey
	upsteps;     // steps taken by siftup
	downsteps;   // steps taken by siftdown

	/** Constructor for ArrayHeap object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 4)
	 */
	constructor(n=10, d=4) {
		super(n);
		this.Item = new Int32Array(n+1);
		this.Pos = new Int32Array(n+1);
		this.Key = new Float32Array(n+1);
		this.Item[0] = this.Size = 0; this.D = d;
		this.Offset = 0;
		this.clearStats();
	}

	/** Assign a new value by copying from another heap.
	 *  @param other is another ArrayHeap
	 */
	assign(other, relaxed=false) {
		super.assign(other, relaxed);

		this.Size = other.size; this.Offset = other.Offset;
		for (let p = 1; p <= other.size; p++) {
			let x = other.Item[p];
			this.Item[p] = x; this.Pos[x] = p; this.Key[x] = other.Key[x];
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another heap.
	 *  @param other is another ArrayHeap
	 */
	xfer(other) {
		if (other == this || !(other instanceof ArrayHeap)) return;
		this.n = other.n;
		this.D = other.D; this.Size = other.Size; this.Offset = other.Offset;
		this.Item = other.Item; this.Pos = other.Pos;
		this.Key = other.Key;
		other.Item = other.Pos = other.Key = null;
		this.clearStats();
	}
	
	/** Remove all elements from heap. */
	clear() {
		for (let x = 1; x <= this.Size; x++) this.Pos[this.Item[x]] = 0;
		this.Size = 0; this.Offset = 0;
	}

	clearStats() {
		this.changekeys = 0; this.upsteps = this.downsteps = 0;
	}

	get d() { return this.D; }

	get size() { return this.Size; }

	itemAt(pos) { return this.Item[pos]; };

	/** Return position of parent of a heap item.
	 *  @param p is position of item in heap
	 *  @param return position where parent would go if there were one
	 */
	p(pos) { return Math.ceil((pos-1)/this.d); }

	/** Return position of leftmost child of a heap item.
	 *  @param pos is position of item in heap
	 *  @param return position where left child would go if there were one
	 */
	left(pos) { return this.d*(pos-1)+2; }

	/** Return position of rightmost child of a heap item.
	 *  @param pos is position of item in heap
	 *  @param return position where right child would go if there were one
	 */
	right(pos) { return this.d*pos+1; }

	first() { return this.size >= 1 ? this.itemAt(1) : 0; }

	next(i) { 
		let pi = this.pos[i];
		return (pi && pi < this.size ?  this.Item[pi+1] : 0);
	}
	
	/** Find an item in the heap with the smallest key.
	 *  @return the number of an item that has the smallest key
	 */
	findmin() { return this.empty() ? 0 : this.itemAt(1); }
	
	/** Delete a minimum key item from the heap and return it.
	 *  @return an item of minimum key from the heap, after deleting it
	 *  from the heap
	 */
	deletemin() {
		if (this.empty()) return 0;
		let i = this.itemAt(1); this.delete(i);
		return i;
	}
	
	/** Get the key of an item.
	 *  @param i is an item in the heap
	 *  @return the value of i's key
	 */
	key(i) { return this.Offset + this.Key[i]; }

	get offset() { return this.Offset; }

	add2keys(delta) { this.Offset += delta; }
	
	/** Determine if an item is in the heap.
	 *  @param i is an item
	 *  @return true if i is in the heap, else false
	 */
	contains(i) { return this.pos[i] != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	empty() { return this.size == 0; };
	
	/** Add index to the heap.
	 *  @param i is an index that is not in the heap
	 *  @param key is the key value under which i is to be inserted
	 */
	insert(i, key) {
		ea && assert(i > 0 && this.valid(i),
					 `ArrayHeap.insert: invalid item ${i}`);
		if (this.contains(i)) { this.changekey(i,key); return; }
		if (i > this.n) this.expand(i);
		this.Key[i] = key - this.Offset; this.Size++; this.siftup(i, this.size);
	}
	
	/** Remove an index from the heap.
	 *  @param i is an index in the heap
	 */
	delete(i) {
		ea && assert(i > 0);
		if (!this.contains(i)) return;
		let j = this.itemAt(this.Size--);
		if (i != j) {
			if (this.Key[j] <= this.Key[i])
				this.siftup(j, this.pos[i]);
			else
				this.siftdown(j, this.pos[i]);
		}
		this.pos[i] = 0;
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	siftup(i, x) {
		this.upsteps++;
		let px = this.p(x);
		while (x > 1 && this.Key[i] < this.Key[this.itemAt(px)]) {
			this.Item[x] = this.itemAt(px); this.pos[this.itemAt(x)] = x;
			x = px; px = this.p(x);
			this.upsteps++;
		}
		this.Item[x] = i; this.pos[i] = x;
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
 	 *  @param x is a tentative position for i in the heap
 	 */
	siftdown(i, x) {
		let cx = this.minchild(x);
		while (cx != 0 && this.Key[this.Item[cx]] < this.Key[i]) {
			this.Item[x] = this.Item[cx]; this.pos[this.Item[x]] = x;
			x = cx; cx = this.minchild(x);
		}
		this.Item[x] = i; this.pos[i] = x;
	}
	
	/** Find the position of the child with the smallest key.
	 *  This is a private helper function, used by siftdown.
	 *  @param x is a position of an index in the heap
	 *  @return the position of the child of the item at x, that has
	 *  the smallest key
	 */
	minchild(x) {
		this.downsteps++;
		let minc = this.left(x);
		if (minc > this.size) return 0;
		for (let y = minc + 1; y <= this.right(x) && y <= this.size; y++) {
			this.downsteps++;
			if (this.Key[this.Item[y]] < this.Key[this.Item[minc]])
				minc = y;
		}
		return minc;
	}
	
	/** Change the key of an item in the heap.
	 *  @param i is an item in the heap
	 *  @param k is a new key value for item i
	 */
	changekey(i, k) {
		this.changekeys++;
		let ki = this.Key[i] + this.Offset;
		//this.Key[i] += k - ki;
		this.Key[i] = k - this.Offset;
			 if (k < ki) this.siftup(i, this.pos[i]);
		else if (k > ki) this.siftdown(i, this.pos[i]);
	}

	/** Determine if two heaps are equal.
	 *  @param other is a heap to be compared to this
	 *  @return true or false if equality can be determined without
	 *  further object comparison; otherwise return an object that
	 *  can be compared
	 */
	equals(other) {
		let h = super.equals(other);
		if (typeof h == 'boolean') return h;
		if (this.size != h.size) return false;
		for (let i = 1; i <= this.size; i++) {
			let x = this.Item[i];
			if (!h.contains(x) || this.key(x) != h.key(x)) return false;
			let y = h.Item[i];
			if (!this.contains(y) || this.key(y) != h.key(y)) return false;
		}
		return h;
	}
	
	/** Produce a string representation of the heap.
	 *  @param showTree is a flag which causes the tree structure
	 *  of the heap to be shown
	 *  @param label is an optional used produce item labels
	 */
	toString(showTree=0, label=0) {
		if (!label) label = (u => this.x2s(u) + ':' + this.key(u));
		if (!showTree || this.size <= 1) {
			let s = '[';
			for (let i = 1; i <= this.size; i++) {
				let lab = label(this.itemAt(i));
				s += (i > 1 && lab ? ' ' : '') + lab;
			}
			return s + ']';
		}
		if (this.size == 1) return '[' + label(this.itemAt(1)) + ']';
		let f = new Forest(this.n);
		for (let x = 2; x <= this.size; x++) {
			f.link(this.itemAt(x),this.itemAt(this.p(x)));
		}
		return f.toString((showTree ? 0x4 : 0), label).slice(1,-1);
	}

	/** Initialize this ArrayHeap object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromString(s) {
		let l = new List();
		let key = [];
		if (!l.fromString(s, (u,sc) => {
							if (!sc.verify(':')) {
								key[u] = 0; return true;
							}
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							key[u] = p;
							return true;
						}))
			return false;
		if (l.n > this.n) this.reset(l.n, this.d);
		else this.clear();
		for (let i = l.first(); i; i = l.next(i)) {
			this.insert(i, key[i]);
}
		return true;
	}

	/** Return statistics object. */
	getStats() {
		return {
			'changekeys' : this.changekeys,
			'upsteps' : this.upsteps, 'downsteps' : this.downsteps,
			'steps' : this.upsteps + this.downsteps
		};
	}
}
