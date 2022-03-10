/** @file SplaySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError} from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import Sets from '../basic/Sets.mjs';
import Scanner from '../basic/Scanner.mjs';
import SortedSets from './SortedSets.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class SplaySets extends SortedSets {
	_splaySteps;	///< number of steps in splay operation

	/** Constructor for SplaySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n, capacity=n) { super(n); this.#init(capacity); }
	
	/** Allocate space and initialize SplaySets object.
	 *  @param capacity is the maximum range
	 */
	#init(capacity) {}

	/** Reset the tree discarding old value.
	 *  @param n is the new range of the index set
	 *  @param capacity the new max range.
	 */
	reset(n, capacity=n) {
		super.reset(n, capacity); this.#init(capacity);
	}
	
	clearStats() {
		super.clearStats();
		this._splaySteps = 0;
	}

	/** Splay a search tree.
	 *  @param x is an item in a bst (equivalently, node in a search tree);
	 *  the operation restructures the tree, moving x to the root
	 *  @return the root of the bst following the restructuring
	 */
	splay(x) {
		while (this.p(x) != 0) this.splaystep(x);
		return x;
	}
	
	/** Perform a single splay step.
	 *  @param x is a node in a search tree
	 */
	splaystep(x) {
		this._splaySteps++;
		let y = this.p(x);
		if (y == 0) return;
		let z = this.p(y);
		if (z != 0) {
			if (this.outer(x))  this.rotate(y);
			else 				this.rotate(x);
		}
		this.rotate(x);
	}

	/** Find the id of the set containing u. */
	find(u) {
		return this.splay(u);
	}

	/** Find an item with a specified key */
	access(k, t) {
		let u = t;
		while (u != 0 && this.key(u) != k) {
			this._accessSteps++;
			if (k < this.key(u)) u = this.left(u);
			else				 u = this.right(u);
		}
		return this.splay(u);
	}

	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) {
		super.insert(u, t); this.splay(u); return u;
	}

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) {
		assert(this.valid(u));
		if (u == 0 || this.singleton(u)) return;
		if (this.left(u) != 0 && this.right(u) != 0) {
			let pu; // find prev(u) and count steps
			for (pu = this.left(pu); this.right(pu) != 0; pu = this.right(pu)) {
				this._deleteSteps++;
			}
			swap(u, pu);
		}
		// now, u has at most one child
		let c = (this.left(u) != 0 ? this.left(u) : this.right(u));
		// c is now the only child that could be non-null
		let pc = this.p(u);
		if (c != 0) this.p(c, pc);
		if (pc != 0) {
				 if (u ==  this.left(pc))  this.left(pc, c);
			else if (u == this.right(pc)) this.right(pc, c);
		}
		this.splay(pc);
		this.p(u,0); this.left(u,0); this.right(u,0);
	}

	split(u) {
		this.splay(u);
		let [l,r] = [ this.left(u), this.right(u) ];
		this.left(u,0); this.right(u,0); this.p(u,0);
		this.p(l,0); this.p(r,0);
		return [l,r];
	}

	/** Return statistics object. */
	getStats() {
		let stats = super.getStats();
		stats.splaySteps = this._splaySteps;
		return stats;
	}
}
