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

import { assert, assertEnabled as ae} from '../../common/Assert.mjs';

/** This class implements a heap data structure.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when a heap object is constructed.
 */
export default class ArrayHeap extends Top {
	d_;          // arity of heap
	size_;       // # of items in the heap set
	offset_;     // offset for key values, allowing all to shift at once

	changekeys;  // calls to changekey
	upsteps;     // steps taken by siftup
	downsteps;   // steps taken by siftdown

	/** Constructor for ArrayHeap object.
	 *  @param n is index range for object
	 *  @parm d is the base of the heap (defaults to 4)
	 */
	constructor(n=10, d=4) {
		super(n);
		this.addProperty(['kee',0]);	// used to store raw key values
		this.addProperty(['itemAt',0]);
		this.addProperty(['position',0]);

		this.size_ = 0; this.d_ = d; this.offset_ = 0;
		this.clearStats();
	}

	/** Remove all elements from heap. */
	clear() {
		for (let x = 1; x <= this.size_; x++) this.position(this.itemAt(x),0);
		this.size_ = 0; this.offset_ = 0;
	}

	clearStats() {
		this.changekeys = 0; this.upsteps = this.downsteps = 0;
	}

	get d() { return this.d_; }

	get size() { return this.size_; }

	//itemAt(pos) { return this.item_[pos]; };

	/** Return position of parent of a heap item.
	 *  @param p is position of item in heap
	 *  @param return position where parent would go if there were one
	 */
	parent(pos) { return Math.ceil((pos-1)/this.d); }

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
		let pi = this.position(i);
		return (pi && pi < this.size ?  this.itemAt(pi+1) : 0);
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
	
	/** Get the corrected key of an item.
	 *  @param i is an item
	 *  @return the value of i's key (including offset)
	 */
	key(i, val=false) {
		if (val != false) {
			ae() && assert(!this.contains(i));
			this.kee(i, val);
		}
		return this.kee(i) + (this.contains(i) ? this.offset_ : 0);
	}

	get offset() { return this.offset_; }

	add2keys(delta) { this.offset_ += delta; }
	
	/** Determine if an item is in the heap.
	 *  @param i is an item
	 *  @return true if i is in the heap, else false
	 */
	contains(i) { return this.position(i) != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	empty() { return this.size == 0; };
	
	/** Add index to the heap.
	 *  @param i is an item that is not in the heap
	 *  @param key is the key value under which i is to be inserted;
	 *  if omitted, the current value of key(i) is used 
	 */
	insert(i, key=this.key(i)) {
		ae() && assert(i > 0 && this.valid(i) && !this.contains(i),
					   `ArrayHeap.insert: invalid item ${i}`);
		this.kee(i, key - this.offset_); this.size_++;
		this.siftup(i, this.size);
	}
	
	/** Remove an item from the heap.
	 *  @param i is an index in the heap
	 */
	delete(i) {
		ae() && assert(i > 0);
		if (!this.contains(i)) return;
		let j = this.itemAt(this.size_--);
		if (i != j) {
			if (this.key(j) <= this.key(i))
				this.siftup(j, this.position(i));
			else
				this.siftdown(j, this.position(i));
		}
		this.kee(i, this.kee(i) + this.offset_);
		this.position(i,0);
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	siftup(i, x) {
		this.upsteps++;
		let px = this.parent(x);
		while (x > 1 && this.kee(i) < this.kee(this.itemAt(px))) {
			this.itemAt(x,this.itemAt(px)); this.position(this.itemAt(x),x);
			x = px; px = this.parent(x);
			this.upsteps++;
		}
		this.itemAt(x,i); this.position(i,x);
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
 	 *  @param x is a tentative position for i in the heap
 	 */
	siftdown(i, x) {
		let cx = this.minchild(x);
		while (cx != 0 && this.kee(this.itemAt(cx)) <
this.kee(i)) {
			this.itemAt(x,this.itemAt(cx));
			this.position(this.itemAt(x),x);
			x = cx; cx = this.minchild(x);
		}
		this.itemAt(x,i); this.position(i,x);
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
			if (this.kee(this.itemAt(y)) <
					this.kee(this.itemAt(minc)))
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
		let ki = this.key(i);
		this.kee(i, k-this.offset_);
			 if (k < ki) this.siftup(i, this.position(i));
		else if (k > ki) this.siftdown(i, this.position(i));
	}

	/** Determine if two heaps are equal.
	 *  @param that is a heap to be compared to this
	 *  @return true or false if equality can be determined without
	 *  further object comparison; otherwise return an object that
	 *  can be compared
	 */
	equals(that, ...args) {
		that = super.equals(that, ...(args.length ? args : [this.n,this.d]));
		if (typeof that == 'boolean') return that;
		if (this.size != that.size) return false;

		for (let i = 1; i <= this.size; i++) {
			let x = this.itemAt(i);
			if (!that.contains(x) || this.key(x) != that.key(x)) return false;
			let y = that.itemAt(i);
			if (!this.contains(y) || this.key(y) != that.key(y)) return false;
		}
		return that;
	}
	
	/** Produce a string representation of the heap.
	 *  @param showTree is a flag which causes the tree structure
	 *  of the heap to be shown
	 *  @param label is an optional used produce item labels
	 */
	toString(showTree=0, label=0) {
		if (!label) label = (u => this.x2s(u,0) + ':' + this.key(u));
		if (!showTree || this.size <= 1) {
			let s = '';
			for (let i = 1; i <= this.size; i++) {
				let lab = label(this.itemAt(i));
				s += (lab && s ? ' ' : '') + lab;
			}
			return '[' + s + ']';
		}
		if (this.size == 1) return '[' + label(this.itemAt(1)) + ']';
		let f = new Forest(this.n);
		for (let x = 2; x <= this.size; x++) {
			f.link(this.itemAt(x),this.itemAt(this.parent(x)));
		}
		return '[' + f.toString((showTree ? 0x4 : 0), label).slice(1,-1) + ']';
	}

	/** Initialize this ArrayHeap object from a string.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	static fromString(s, n=10, d=4) {
		let l = List.fromString(s,n,['key',0]);
		if (!l) return null;

		let ah = new ArrayHeap(l.n, d);

		for (let i = l.first(); i; i = l.next(i)) {
			ah.insert(i, l.key(i));
		}
		return ah;
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
