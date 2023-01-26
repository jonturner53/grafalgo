/** @file GroupHeap.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../../dataStructures/Top.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import ArrayHeap from '../heaps/ArrayHeap.mjs';
import OrderedHeaps from './OrderedHeaps.mjs';

//import { fassert } from '../../common/Errors.mjs';
let fassert = (()=>1);

/** Data structure representing a group heap.
 *  The collection of items is divided into "groups", where each
 *  group is classified as "active" or "inactive" and can change status
 *  on request. Items within each group have a defined list order.
 *  The items in the active groups define a single collective heap,
 *  and operations like findmin are defined on this heap.
 *  Each group has a group identifier that is assigned by the client.
 *
 *  This data structure was originally devised to support
 *  Galil, Micali and Gabow's variation of Edmonds algorithm
 *  for weighted matching in general graphs.
 */
export default class GroupHeap extends Top {
	gn;           // index range for group identifiers

	groups;       // OrderedHeaps data structure with a heap for each group.
	top           // top[g] is the item at the top of heap for group g
	active;       // ArrayHeap of active groups, with
				  // key(g)=the smallest key of any item in group g
	lastOffset;   // for an active group b, lastOffset[b] is the value of
                  // active.offset, when b was last modified or became active

	steps;        // number of steps
	
	/** Constructor for GroupHeap object.
	 */
	constructor(n=10, gn=5) {
		super(n); this.gn = gn;

		this.groups = new OrderedHeaps(n);
		this.active = new ArrayHeap(gn);
		this.top = new Int32Array(gn+1);
		this.lastOffset = new Float32Array(gn+1);

		this.steps = 0;
	}

	/** Assign new value to this from another. 
	 *  @param other is a GroupHeap object
	 */
	assign(other) {
		fassert(other instanceof GroupHeap);
		if (other == this) return;
		if (other.n != this.n || other.gn != this.gn)
			this.reset(other.n, other.gn);
		this.groups.assign(other.groups);
		this.active.assign(other.top);
		for (let g = 1; g <= this.n; g++) {
			this.top[g] = other.top[g];
		}
	}

	/** Assign a new value to this, by transferring contents of another object.
	 *  @param other is another GroupHeap object
	 */
	xfer(other) {
		fassert(other instanceof GroupHeap);
		if (other == this) return;
		this._n = other.n; this.gn = other.gn;
		this.groups = other.groups; this.top = other.top;
		this.active = other.active; this.lastOffset = other.lastOffset;
		other.groups = other.top = other.active = other.lastOffset = null;
	}
	
	/** Restore to initial state. */
	clear(g=0) {
		if (g) {
			this.groups.clear(this.top[g]);
			this.top[g] = 0; this.lastOffset[g] = 0;
			if (this.isactive(g)) this.active.delete(g);
		} else {
			this.groups.clear(); this.top.fill(0); this.active.clear();
			this.lastOffset.fill(0);
		}
	}

	/** Check empty status of active heap or a specific group.
	 *  @param g is a group id; if present returns true if the
	 *  group is empty, otherwise returns true if there is no
	 *  active group that is not empty.
	 */ 
	empty(g=0) {
		return (g ? this.top[g] != 0 : this.active.empty() ||
					this.active.key(this.active.findmin()) == Infinity);
	}

	/** Determine if a group is active. */
	isactive(g) { return this.active.contains(g); }

	/** Check for item in an active group
	 *  @param i is an item
	 *  @param h is the group containing i
	 *  @return true if g is active and contains i, else false
	 */
	contains(i, g) {
		return this.isactive(g) ? this.groups.contains(i, this.top[g]) : false;
	}

	/** Get the key of an item.
	 *  @param i is an item in some heap
	 *  @param g is the group that i belongs to
	 *  @return the key of i
	 */
	key(i, g) {
		if (this.isactive(g)) this.#updateKeys(g);
		return this.groups.key(i, this.top[g]);
	}

	/** Update the keys of an active group.
	 *  @param g is an active group
	 */
	#updateKeys(g) {
		if (this.top[g]) {
			this.groups.add2keys(this.active.offset - this.lastOffset[g],
					 			 this.top[g]);
		}
		this.lastOffset[g] = this.active.offset;
	}

	/** Activate a group */
	activate(g) {
		let h = this.top[g];
		fassert(h /*, 'GroupHeap.activate requires a non-empty heap'*/);
		this.active.insert(g, h ? this.key(this.groups.findmin(h),g) :
										   Infinity);
		this.lastOffset[g] = this.active.offset;
	}

	/** Deactivate a group */
	deactivate(g) { this.#updateKeys(g); this.active.delete(g); }

	/** Find the active item with the smallest key.  */
	findmin() {
		let g = this.active.findmin();
		if (!g) return 0;
		this.#updateKeys(g);
		return this.groups.findmin(this.top[g]);
	}

	/** Modify the key values of all active items.
	 *  @param delta is a value to be added to the keys of all active items.
	 */
	add2keys(delta) { this.active.add2keys(delta); }

	/** Insert an item into a group.
	 *  @param i is an item to be inserted into a group
	 *  @param g is the id of group in which i is to be inserted
	 *  @param k is the required key value for i
	 *  @param i0 is an item in the heap; i is inserted immediately after i0
	 */
	insertAfter(i, g, k, i0) {
		if (this.isactive(g)) this.#updateKeys(g);
		let h = this.top[g];
		this.top[g] = this.groups.insertAfter(i, h, k, i0);
		if (this.isactive(g) && k < this.active.key(g)) {
			this.active.changekey(g, k);
		}
	}

	/** Delete an item from a heap.
	 *  @param i is an item to be deleted
	 *  @param g is the id of the group containing i
	 */
	delete(i, g) {
		if (this.isactive(g)) this.#updateKeys(g);
		this.top[g] = this.groups.delete(i, this.top[g]);
		if (this.isactive(g)) {
			let h = this.top[g];
			if (!h) {
				this.deactivate(g);
			} else {
				let min = this.key(this.groups.findmin(h), g);
				if (this.active.key(g) != min)
					this.active.changekey(g, min);
			}
		}
	}

	/** Divide a group into two parts. 
	 *  @param g is the id of a group to be divided; if it is active,
	 *  it is first deactivated
	 *  @param i is an item in g; it is divided into two parts, one
	 *  containing the items that precede i in the group and one
	 *  containing the remaining items; if i=0, then the group for g
	 *  is transferred to g0, making g's group empty
	 *  @param g0 is the id assigned to be assigned to the first group
	 *  resulting from the division; the remainder is identified by g
	 */
	divide(g, i, g0) {
		if (this.isactive(g)) {
			this.#updateKeys(g); this.deactivate(g);
		}
		if (i == 0) {
			this.top[g0] = this.top[g]; this.top[g] = 0;
		} else {
			[this.top[g0], this.top[g]] = this.groups.divide(i, this.top[g]);
		}
		if (this.isactive(g) && !this.top[g])
			this.deactivate(g);
	}

	/** Determine if two GroupHeap objects are equal.
	 */
	equals(other) {
		other = super.equals(other);
		if (typeof other == 'boolean') return other;
		if (other.gn != this.gn) return false;

		if (!this.active.equals(other.active)) return false;

		for (let g = 1; g <= this.gn; g++) {
			let h = this.top[g]; let hh = other.top[g];
			if ((h && !hh) || (!h && h)) return false;
			if (!h) continue;
			let u = this.groups.first(h); let uu = other.groups.first(hh);
			while (u && uu) {
				if (u != uu) return false;
				if (this.key(u,g) != other.key(uu,g)) return false;
				u = this.groups.next(u); uu = other.groups.next(uu);
			}
			if (u != uu) return false;
		}
		return other;
	}

	/** Create a string representation of GroupHeap object.
	 *  @param fmt is an integer with bits representing format options
	 *      0001 specifies newlines separating groups
	 *      0010 specifies that groups are shown
	 *      0100 specifies that tree representation of groups is shown
	 *  @return the string representation of the object
	 */
	toString(fmt=0x2, itemLabel=0, heapLabel=0) {
		let s = '';
		if (!itemLabel) itemLabel = (u => this.x2s(u));
		if (fmt == 0) { // suppress group details
			s += '['; let first = true;
			for (let g = 1; g <= this.gn; g++) {
				if (!this.top[g] || !this.isactive(g)) continue;
				this.#updateKeys(g); let h = this.top[g];
				for (let i = this.groups.first(h); i; i = this.groups.next(i)) {
					let lab = itemLabel(i);
					if (!lab) continue;
					if (first) first = false;
					else s += ' ';
					if (g == this.active.findmin() && 
						i == this.groups.findmin(h)) {
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
		for (let g = 1; g <= this.gn; g++) {
			if (!this.top[g] && !this.isactive(g)) continue;
			if (this.isactive(g)) this.#updateKeys(g);
			let h = this.top[g];
			if (!(fmt&0x1) && s) s += ' ';
			s += heapLabel(g);
			s += (!h ? '[]' : this.groups.tree2string(h, fmt,
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
		let gn = 0; let heapIds = new Set();
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
			gn = Math.max(g, gn);
			heapIds.add(g);
			lists.push([g,active,l]);
		}
		if (n != this.n || gn != this.gn) this.reset(n,gn);
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
					  this.groups.getStats().steps;
		return { 'steps': this.steps };
	}
}
