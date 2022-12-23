/** @file PartitionedHeap.mjs
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
 *  The collection of heap items is divided into "groups", where each
 *  group is classified as "active" or "inactive" and can change status
 *  on request. Heap items within each group have a defined list order
 *  that is maintained, in addition to the usual ordering based on keys.
 *  The items in the active groups define a single collective heap,
 *  and operations line findmin are defined on this heap.
 *  Each group has a group identifier that is assigned by the client.
 *
 *  This data structure was originally devised to support
 *  Galil, Micali and Gabow's variation of Edmonds algorithm
 *  for weighted matching in general graphs.
 */
export default class PartitionedHeap extends Top {
	hn;           // index range for subheap identifiers

	subs;         // OrderedHeaps data structure defining subheaps.
	top           // top[b] is the item at the top of subheap b
	active;       // ArrayHeap of active subheaps, with
				  // key(b)=the smallest key in subheap b
	lastOffset;   // for an active subheap b, lastOffset[b] is the value of
                  // active.offset, when b was last modified or became active

	steps;        // number of steps
	
	/** Constructor for PartitionedHeap object.
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
	 *  @paran other is a PartitionedHeap object
	 */
	assign(other) {
		fassert(other instanceof PartitionedHeap);
		if (other == this) return;
		if (other.n != this.n || other.hn != this.hn)
			this.reset(other.n, other.hn);
		this.subs.assign(other.subs);
		this.active.assign(other.top);
		for (let g = 1; g <= this.n; g++) {
			this.top[g] = other.top[g];
		}
	}

	/** Assign a new value to this, by transferring contents of another object.
	 *  @param other is another PartitionedHeaps object
	 */
	xfer(other) {
		fassert(other instanceof PartitionedHeap);
		if (other == this) return;
		this._n = other.n; this.hn = other.hn;
		this.subs = other.subs; this.top = other.top;
		this.active = other.active; this.lastOffset = other.lastOffset;
		other.subs = other.top = other.active = other.lastOffset = null;
	}
	
	/** Restore to initial state. */
	clear(g=0) {
		if (g) {
			this.subs.clear(this.top[g]);
			this.top[g] = 0; this.lastOffset[g] = 0;
			if (this.isactive(g)) this.active.delete(g);
		} else {
			this.subs.clear(); this.top.fill(0); this.active.clear();
			this.lastOffset.fill(0);
		}
	}

	/** Check empty status of active heap or a specific subheap.
	 *  @param g is a subheap id; if present returns true if the
	 *  subheap is empty, otherwise returns true if there is no
	 *  active subheap that is not empty.
	 */ 
	empty(g=0) {
		return (g ? this.top[g] != 0 : this.active.empty() ||
					this.active.key(this.active.findmin()) == Infinity);
	}

	/** Determine if a subheap is active. */
	isactive(g) { return this.active.contains(g); }

	/** Check for item in an active subheap */
	contains(i, g) {
		return this.isactive(g) ? this.subs.contains(i, this.top[g]) : 0;
	}

	/** Get the key of an item.
	 *  @param i is an item in some heap
	 *  @param g is the subheap that i belongs to
	 *  @return the key of i
	 */
	key(i, g) {
		if (this.isactive(g)) this.#updateKeys(g);
		return this.subs.key(i, this.top[g]);
	}

	/** Update the keys of an active subheap.
	 *  @param g is an active subheap
	 */
	#updateKeys(g) {
		if (this.top[g]) {
			this.subs.add2keys(this.active.offset - this.lastOffset[g],
						   this.top[g]);
		}
		this.lastOffset[g] = this.active.offset;
	}

	/** Activate a subheap */
	activate(g) {
		let h = this.top[g];
		fassert(h, 'PartitionedHeap.activate requires a non-empty heap');
		this.active.insert(g, h ? this.key(this.subs.findmin(h),g) : Infinity);
		this.lastOffset[g] = this.active.offset;
	}

	/** Deactivate a subheap */
	deactivate(g) { this.#updateKeys(g); this.active.delete(g); }

	/** Modify the key values of items in active subs.
	 *  @param delta is a value to be added to the keys.
	 */
	add2keys(delta) { this.active.add2keys(delta); }

	/** Find the item in an active heap with the smallest key.
	 *  @return the edge with the smallest key incident to g
	 */
	findmin() {
		let g = this.active.findmin();
		if (!g) return 0;
		this.#updateKeys(g);
		return this.subs.findmin(this.top[g]);
	}

	/** Insert an item into a heap.
	 *  @param i is an item to be inserted into a heap
	 *  @param g is the id of subheap in which i is to be inserted
	 *  @param k is the required key value for i
	 *  @param i0 is an item in the heap; i is inserted immediately after i0
	 */
	insertAfter(i, g, k, i0) {
		if (this.isactive(g)) this.#updateKeys(g);
		let h = this.top[g];
		this.top[g] = this.subs.insertAfter(i, h, k, i0);
		if (this.isactive(g) && k < this.active.key(g)) {
			this.active.changekey(g, k);
		}
	}

	/** Delete an item from a heap.
	 *  @param i is an item to be deleted
	 *  @param g is the id of the subheap containing i
	 */
	delete(i, g) {
		if (this.isactive(g)) this.#updateKeys(g);
		this.top[g] = this.subs.delete(i, this.top[g]);
		if (this.isactive(g)) {
			let h = this.top[g];
			if (!h) {
				this.deactivate(g);
			} else {
				let min = this.key(this.subs.findmin(h), g);
				if (this.active.key(g) != min)
					this.active.changekey(g, min);
			}
		}
	}

	/** Divide a subheap into two parts. 
	 *  @param g is the id of a subheap to be divided; if it is active,
	 *  it is first deactivated
	 *  @param i is an item in g; it is divided into two parts, one
	 *  containing the items that precede i in the subheap and one
	 *  containing the remaining items; if i=0, then the subheap for g
	 *  is transferred to g0, making g's subheap empty
	 *  @param g0 is the id assigned to be assigned to the first subheap
	 *  resulting from the division; the remainder is identified by g
	 */
	divide(g, i, g0) {
		if (this.isactive(g)) {
			this.#updateKeys(g); this.deactivate(g);
		}
		if (i == 0) {
			this.top[g0] = this.top[g]; this.top[g] = 0;
		} else {
			[this.top[g0], this.top[g]] = this.subs.divide(i, this.top[g]);
		}
		if (this.isactive(g) && !this.top[g])
			this.deactivate(g);
	}

	/** Determine if two PartitionedHeap objects are equal.
	 */
	equals(other) {
		other = super.equals(other);
		if (typeof other == 'boolean') return other;
		if (other.hn != this.hn) return false;

		if (!this.active.equals(other.active)) return false;

		for (let g = 1; g <= this.hn; g++) {
			let h = this.top[g]; let hh = other.top[g];
			if ((h && !hh) || (!h && h)) return false;
			if (!h) continue;
			let u = this.subs.first(h); let uu = other.subs.first(hh);
			while (u && uu) {
				if (u != uu) return false;
				if (this.key(u,g) != other.key(uu,g)) return false;
				u = this.subs.next(u); uu = other.subs.next(uu);
			}
			if (u != uu) return false;
		}
		return other;
	}

	/** Create a string representation of PartitionedHeap object.
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
			for (let g = 1; g <= this.hn; g++) {
				if (!this.top[g] || !this.isactive(g)) continue;
				this.#updateKeys(g); let h = this.top[g];
				for (let i = this.subs.first(h); i; i = this.subs.next(i)) {
					let lab = itemLabel(i);
					if (!lab) continue;
					if (first) first = false;
					else s += ' ';
					if (g == this.active.findmin() && 
						i == this.subs.findmin(h)) {
						s += '*';
					}
					s += lab + ':' + 
					  (this.key(i,g) == Infinity ? 'I' : this.key(i,g));
				}
			}
			s += ']';
			return s;
		}

		if (!heapLabel) {
			heapLabel = (g => '' + g +
									(this.isactive(g) ? '@' : '') +
									(this.active.findmin() == g ? '!' : ''));
		}
		for (let g = 1; g <= this.hn; g++) {
			if (!this.top[g] && !this.isactive(g)) continue;
			if (this.isactive(g)) this.#updateKeys(g);
			let h = this.top[g];
			if (!(fmt&0x1) && s) s += ' ';
			s += heapLabel(g);
			s += (!h ? '[]' : this.subs.tree2string(h, fmt,
				(u => itemLabel(u) + ':' + 
					  (this.key(u,g) == Infinity ? 'I' : this.key(u,g)))));
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
								if (!sc.verify(':')) {
									key[u] = 0; return true;
								}
								let p = sc.nextNumber();
								if (Number.isNaN(p)) return false;
								key[u] = p;
								return true
								};
		if (!sc.verify('{')) return false;
		let lists = [];
		let n = 0; let items = new Set();
		let hn = 0; let heapIds = new Set();
		while (!sc.verify('}')) {
			let g = sc.nextNumber();
			if (Number.isNaN(g)) return false;
			let active = sc.verify('@');
			if (sc.verify('!')) {}	// ignore min mark
			let l = sc.nextIndexList('[', ']', getProp);
			if (!l) return false;
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return false;
				items.add(i);
			}
			if (heapIds.has(g)) return false;
			hn = Math.max(g, hn);
			heapIds.add(g);
			lists.push([g,active,l]);
		}
		if (n != this.n || hn != this.hn) this.reset(n,hn);
		else this.clear();
		for (let [g,active,l] of lists) {
			let previ = 0;
			for (let i of l) {
				this.insertAfter(i, g, key[i], previ);
				previ = i;
			}
			if (active) this.activate(g);
		}
		return true;
	}

	getStats() {
		this.steps += this.active.getStats().steps +
					  this.subs.getStats().steps;
		return { 'steps': this.steps };
	}

	verify() {
		for (let g = 1; g <= this.hn; g++) {
		}
	}
}
