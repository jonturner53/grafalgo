/** @file DivisibleHeap.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../../dataStructures/Top.mjs';
import { fassert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import ArrayHeap from './ArrayHeap.mjs';
import OrderedHeaps from './OrderedHeaps.mjs';

/** Data structure representing a divisible heap.
 *  A collection of "ordered subheaps" parititions the heap items; subheaps
 *  are divided into two categories: "active" and "inactive". Heap operations
 *  findmin and add2keys are defined over the items in active heaps,
 *  effectively treating those items as a single unified heap.
 *  Operations insertAfter, delete and divide are defined on subheaps.
 *  Subheaps are identified by a subheap identifier, assigned by the client.
 *  Items within a subheap have a defined "list order" which is maintained
 *  by all the operations.
 *
 *  This data structure was originally devised to support
 *  Galil, Micali and Gabow's variation of Edmonds algorithm
 *  for weighted matching in general graphs.
 */
export default class DivisibleHeap extends Top {
	hn;           // index range for subheap identifiers

	subs;         // OrderedHeaps data structure defining subheaps.
	top           // top[b] is the item at the top of subheap b
	active;       // ArrayHeap of active subheaps, with
				  // key(b)=the smallest key in subheap b
	lastOffset;   // for an active subheap b, lastOffset[b] is the value of
                  // active.offset, when b was last modified or became active

	steps;        // number of steps
	
	/** Constructor for DivisibleHeap object.
	 */
	constructor(n=10, hn=5) {
		super(n); this.hn = hn;

		this.subs = new OrderedHeaps(n);
		this.active = new ArrayHeap(hn);
		this.top = new Int32Array(hn+1);
		this.lastOffset = new Float32Array(hn+1);

		this.steps = 0;
	}

	/** Assign new value to this from another. 
	 *  @paran bloss is a EdgeHeaps object
	 */
	assign(dh) {
		fassert(dh instanceof DivisibleHeap);
		if (dh == this) return;
		if (dh.n != this.n || dh.hn != this.hn)
			this.reset(dh.n, dh.hn);
		this.subs.assign(dh.subs);
		this.active.assign(dh.top);
		for (let b = 1; b <= this.n; b++) {
			this.top[b] = dh.top[b];
		}
	}

	/** Assign a new value to this, by transferring contents of another object.
	 *  @param dh is another DivisibleHeaps object
	 */
	xfer(dh) {
		fassert(dh instanceof DivisibleHeap);
		if (dh == this) return;
		this._n = dh.n; this.hn = dh.hn;
		this.subs = dh.subs; this.top = dh.top;
		this.active = dh.active; this.lastOffset = dh.lastOffset;
		dh.subs = dh.top = dh.active = dh.lastOffset = null;
	}
	
	/** Restore to initial state. */
	clear(b=0) {
		if (b) {
			this.subs.clear(this.top[b]);
			this.top[b] = 0; this.lastOffset[b] = 0;
			if (this.isactive(b)) this.active.delete(b);
		} else {
			this.subs.clear(); this.top.fill(0); this.active.clear();
			this.lastOffset.fill(0);
		}
	}

	/** Check empty status of active heap or a specific subheap.
	 *  @param b is a subheap id; if present returns true if the
	 *  subheap is empty, otherwise returns true if there is no
	 *  active subheap that is not empty.
	 */ 
	empty(b=0) {
		return (b ? this.top[b] != 0 : this.active.empty() ||
					this.active.key(this.active.findmin()) == Infinity);
	}

	/** Determine if a subheap is active. */
	isactive(b) { return this.active.contains(b); }

	/** Check for item in an active subheap */
	contains(e, b) {
		return this.isactive(b) ? this.subs.contains(e, this.top[b]) : 0;
	}

	/** Get the key of an item.
	 *  @param e is an item in some heap
	 *  @param b is the subheap that e belongs to
	 *  @return the key of e
	 */
	key(e, b) {
		if (this.isactive(b)) this.#updateKeys(b);
		return this.subs.key(e, this.top[b]);
	}

	/** Update the keys of an active subheap.
	 *  @param b is an active subheap
	 */
	#updateKeys(b) {
		if (this.top[b]) {
			this.subs.add2keys(this.active.offset - this.lastOffset[b],
						   this.top[b]);
		}
		this.lastOffset[b] = this.active.offset;
	}

	/** Activate a subheap */
	activate(b) {
		let h = this.top[b];
		fassert(h, 'DivisibleHeap.activate requires a non-empty heap');
		this.active.insert(b, h ? this.key(this.subs.findmin(h),b) : Infinity);
		this.lastOffset[b] = this.active.offset;
	}

	/** Deactivate a subheap */
	deactivate(b) { this.#updateKeys(b); this.active.delete(b); }

	/** Modify the key values of items in active subs.
	 *  @param delta is a value to be added to the keys.
	 */
	add2keys(delta) { this.active.add2keys(delta); }

	/** Find the item in an active heap with the smallest key.
	 *  @return the edge with the smallest key incident to b
	 */
	findmin() {
		let b = this.active.findmin();
		if (!b) return 0;
		this.#updateKeys(b);
		return this.subs.findmin(this.top[b]);
	}

	/** Insert an item into a heap.
	 *  @param e is an item to be inserted into a heap
	 *  @param e0 is an item in the heap; e is inserted immediately after e0
	 *  @param k is the required key value for e
	 *  @param b is the id of subheap in which e is to be inserted
	 */
	insertAfter(e, ee, k, b) {
		if (this.isactive(b)) this.#updateKeys(b);
		let h = this.top[b];
		this.top[b] = this.subs.insertAfter(e, ee, k, h);
		if (this.isactive(b) && k < this.active.key(b)) {
			this.active.changekey(b, k);
		}
	}

	/** Delete an item from a heap.
	 *  @param e is an item to be deleted
	 *  @param b is the id of the subheap containing e
	 */
	delete(e, b) {
		if (this.isactive(b)) this.#updateKeys(b);
		this.top[b] = this.subs.delete(e, this.top[b]);
		if (this.isactive(b)) {
			let h = this.top[b];
			if (!h) {
				this.deactivate(b);
			} else {
				let min = this.key(this.subs.findmin(h), b);
				if (this.active.key(b) != min)
					this.active.changekey(b, min);
			}
		}
	}

	/** Divide a subheap into two parts. 
	 *  @param b is the id of a subheap to be divided; if it is active,
	 *  it is first deactivated
	 *  @param e is an item in b; it is divided into two parts, one
	 *  containing the items that precede e in the subheap and one
	 *  containing the remaining items; if e=0, then the subheap for b
	 *  is transferred to b0, making b's subheap empty
	 *  @param b0 is the id assigned to be assigned to the first subheap
	 *  resulting from the division; the remainder is identified by b
	 */
	divide(b, e, b0) {
		if (this.isactive(b)) {
			this.#updateKeys(b); this.deactivate(b);
		}
		if (e == 0) {
			this.top[b0] = this.top[b]; this.top[b] = 0;
		} else {
			[this.top[b0], this.top[b]] = this.subs.divide(e, this.top[b]);
		}
		if (this.isactive(b) && !this.top[b])
			this.deactivate(b);
	}

	/** Determine if two DivisibleHeap objects are equal.
	 */
	equals(other) {
		let dh = super.equals(other);
		if (typeof dh == 'boolean') return dh;
		if (dh.hn != this.hn) return false;

		if (!this.active.equals(dh.active)) return false;

		for (let b = 1; b <= this.hn; b++) {
			let h = this.top[b]; let hh = dh.top[b];
			if ((h && !hh) || (!h && h)) return false;
			if (!h) continue;
			let u = this.subs.first(h); let uu = dh.subs.first(hh);
			while (u && uu) {
				if (u != uu) return false;
				if (this.key(u,b) != dh.key(uu,b)) return false;
				u = this.subs.next(u); uu = dh.subs.next(uu);
			}
			if (u != uu) return false;
		}
		return dh;
	}

	/** Create a string representation of DivisibleHeap object.
	 *  @param fmt is an integer with bits representing format options
	 *      0001 specifies newlines separating subheaps
	 *      0010 specifies that subheaps are shown
	 *      0100 specifies that tree representation of subheaps is shown
	 *  @return the string representation of the object
	 */
	toString(fmt=0x2, itemLabel=0, heapLabel=0) {
		let s = '';
		if (!itemLabel) itemLabel = (u => this.x2s(u));
		if (fmt == 0) { // suppress subheap details
			s += '['; let first = true;
			for (let b = 1; b <= this.hn; b++) {
				if (!this.top[b] || !this.isactive(b)) continue;
				this.#updateKeys(b); let h = this.top[b];
				for (let e = this.subs.first(h); e; e = this.subs.next(e)) {
					let lab = itemLabel(e);
					if (!lab) continue;
					if (first) first = false;
					else s += ' ';
					if (b == this.active.findmin() && 
						e == this.subs.findmin(h)) {
						s += '*';
					}
					s += lab + ':' + 
					  (this.key(e,b) == Infinity ? 'I' : this.key(e,b));
				}
			}
			s += ']';
			return s;
		}

		if (!heapLabel) {
			heapLabel = (b => '' + b +
									(this.isactive(b) ? '@' : '') +
									(this.active.findmin() == b ? '!' : ''));
		}
		for (let b = 1; b <= this.hn; b++) {
			if (!this.top[b] && !this.isactive(b)) continue;
			if (this.isactive(b)) this.#updateKeys(b);
			let h = this.top[b];
			if (!(fmt&0x1) && s) s += ' ';
			s += heapLabel(b);
			s += (!h ? '[]' : this.subs.tree2string(h, fmt,
				(u => itemLabel(u) + ':' + 
					  (this.key(u,b) == Infinity ? 'I' : this.key(u,b)))));
			if (fmt&0x1) s += '\n';
		}
		return fmt&0x1 ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @return true on success, else false
	 */
	fromString(s) {
		let sc = new Scanner(s);
		let key = [];
		let getProp = (u,sc) => {
								if (!sc.verify(':')) return;
								let p = sc.nextNumber();
								if (Number.isNaN(p)) return;
								key[u] = p;
								};
		if (!sc.verify('{')) return false;
		let lists = [];
		let n = 0; let items = new Set();
		let hn = 0; let heapIds = new Set();
		while (!sc.verify('}')) {
			let b = sc.nextNumber();
			if (Number.isNaN(b)) return false;
			let active = sc.verify('@');
			if (sc.verify('!')) {}	// ignore second asterisk
			let l = sc.nextIndexList('[', ']', getProp);
			if (!l) return false;
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return false;
				items.add(i);
			}
			if (heapIds.has(b)) return false;
			hn = Math.max(b, hn);
			heapIds.add(b);
			lists.push([b,active,l]);
		}
		if (n != this.n || hn != this.hn) this.reset(n,hn);
		else this.clear();
		for (let [b,active,l] of lists) {
			let previ = 0;
			for (let i of l) {
				this.insertAfter(i, previ, key[i], b);
				previ = i;
			}
			if (active) this.activate(b);
		}
		return true;
	}

	getStats() {
		this.steps += this.active.getStats().steps +
					  this.subs.getStats().steps;
		return { 'steps': this.steps };
	}

	verify() {
		for (let b = 1; b <= this.hn; b++) {
		}
	}
}
