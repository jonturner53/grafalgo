/** @file Blossoms.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../../dataStructures/Top.mjs';
import { assert } from '../../common/Errors.mjs';
import Blossoms0 from './Blossoms0.mjs';
import List from '../../dataStructures/basic/List.mjs';
import BinaryForest from '../../dataStructures/graphs/BinaryForest.mjs';

/** Data structure representing a collection of blossoms for use in
 *  Edmonds algorithm for weighted matching. Extended to speed up
 *  identification of outer blossom containing a vertex.
 */
export default class Blossoms extends Blossoms0 {
	#outer;         // sets of vertices in outer blossoms

	#bid;           // bid[u] is blossom id of u, a tree root in outer
	#vset;          // vset[b] is root of tree in outer for an outer blossom b

	/** Constructor for Blossoms object.
	 *  @param g is the client's graph on which matching is computed
	 *  @param match is the client's matching object
	 */
	constructor(g, match) {
		super(g,match); this.#init();
	}

	#init() {
		this.#outer = new BinaryForest(this.g.n);
		this.#outer.addRanks();
		this.#bid = new Int32Array(this.g.n+1);
		this.#vset = new Int32Array(this.n+1);
		for (let i = 0; i <= this.g.n; i++)
			this.#bid[i] = this.#vset[i] = i;
	}

	/** Reset this. */
	reset(g, match) {
		super.reset(); this.#init();
	}

	/** Assign new value to this from another. 
	 *  @paran bloss is a Blossoms object
	 */
	assign(bloss) {
		if (bloss == this) return;
		super.assign(bloss);
		for (let u = 0; u <= this.g.n; u++) {
			this.#bid[u] = bloss.#bid[u];
		}
		for (let b = 0; b <= this.n; b++) {
			this.#vset[b] = bloss.#vset[b];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param bloss is another Blossom object
	 */
	xfer(bloss) {
		if (bloss == this) return;
		super.xfer(bloss);
		this.#bid = bloss.#bid; this.#vset = bloss.#vset;
		bloss.#bid = bloss.#vset = null;
	}
	
	/** Restore to initial state. */
	clear() {
		super.clear();
		this.#bid.fill(0); this.#vset.fill(0);
		for (let u = 0; u <= this.g.n; u++)
			this.#bid[u] = this.#vset[u] = u;
	}

	vset(b,u=-1) { if (u!=-1) this.#vset[b] = u; return this.#vset[b]; }

	bid(r,b=-1) { if (b!=-1) this.#bid[r] = b; return this.#bid[r]; }

	/** Get the outer blossom containing a vertex or sub-blossom. */
	outer(b) {
		return this.#bid[this.#outer.find(b)];
	}

	/** Get the first vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @return the first vertex in b
	 */
	firstIn(b) {
		return this.#outer.first(this.#vset[b]);
	}

	nextIn(b,u) {
		return this.#outer.next(u);
	}

	/** Reverse the matching edges in a portion of a non-trivial blossom.
	 *  @param u is the endpoint of an edge incident to a blossom
	 *  @param bu is the id of a blossom containing u; this method
	 *  reverses the matching status of edges joining sub-blossoms
	 *  within bu on the even length path to the sub-blossom of bu
	 *  containing u; it is recalled recursively on each non-trivial
	 *  sub-blossom.
	 *  @param nextVertex is first vertex following those within bu
	 *  @return a list of the flipped edges
	 */
	flip(bu, u, nextVertex=0) {
		if (bu <= this.g.n) return;
		let sb0 = this.firstSub(bu);
		super.flip(bu, u, nextVertex);
		let sbu = this._pathmark(bu);

		if (sb0 != sbu) {
			// rotate vertex set of bu in outer, then bu's sub-blossom list
			// note that at this point, the recursive calls to flip have
			// already adjusted the order within each sub-blossom
			let f_bu = this.base(sb0);  // first vertex in bu
			let f_sbu = u; // first vertex in sbu
			let [t0,] = this.#outer.split(f_bu);
			let [,t3] = this.#outer.split(nextVertex);
			let [t1,t2] = this.#outer.split(f_sbu);
			let t = this.#outer.join(
				this.#outer.join(t0,f_sbu,t2),
				f_bu,
				nextVertex == 0 ? t1 : this.#outer.join(t1,nextVertex,t3)
			);
		}

		// finally, set the bid and vset values for the outer blossom
		// and set the base to u
		if (this.parent(bu) == 0) {
			let root = this.#outer.find(u);
			this.vset(bu, root); this.bid(root, bu);
		}
		return;
	}

	/** Construct a blossom from a list.
	 *  @param blist is a list of outer blossoms
	 *  @return a new blossom obtained by combinining the blossoms in blist
	 */
	construct(blist) {
		let nub = super.construct(blist);

		let b0 = blist.first();
		let root = this.vset(b0); this.vset(b0,0);
		for (let b = blist.next(b0); b != 0; b = blist.next(b)) {
			root = this.#outer.append(root, this.vset(b));
			this.vset(b,0);
		}
		this.bid(root,nub); this.vset(nub,root);
		return nub;
	}

	/** Deconstruct an outer blossom.
	 *  @param b is blossom to be deconstructed; sub-blossoms of b become
	 *  outer blossoms and blossom id for b is recycled; the sub-blossoms
	 *  of b are placed in #blist as a side effect
	 *  @return a list of the sub-blossoms
	 */
	deconstruct(b) {
		let blist = super.deconstruct(b);
		let rem = this.vset(b);
		for (let b = blist.first(); b; b = blist.next(b)) {
			this.steps++;
			if (b == blist.last()) {
				this.bid(rem,b); this.vset(b,rem);
			} else {
				let nv = this.base(blist.next(b));
				let [t1,t2] = this.#outer.split(nv);
				this.bid(t1,b); this.vset(b,t1);
				rem = this.#outer.join(0,nv,t2);
			}
		}
		return blist;
	}

	/** Create a string representation of Blossoms object.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(details=0, pretty=0, label=false) {
		let s = super.toString(details, pretty, label);
		if (details) {
			s += pretty ? 'outer blossom vertex sets:\n    ' : ' ';
			s += this.#outer.toString(-1,0,label);
			if (pretty) s +='\n';
		}
		return s;
	}

	/** Initialize object from string. */
	fromString(s) {
		if (!super.fromString(s)) return false;
		// now initialize #outer to match #bloss
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			let t = super.firstIn(b);
			for (let u = super.nextIn(b,t); u; u = super.nextIn(b,u)) {
				t = this.#outer.append(t,u);
			}
			this.bid(t,b); this.vset(b,t);
		}
		return true;
	}
	
	/** Verify that object is consistent. */
	verify() {
		let s = super.verify();
		if (s) return s;
		// check that vset and bid values match
		for (let u = 1; u <= this.g.n; u++) {
			if (this.#outer.p(u) == 0 && this.vset(this.bid(u)) != u)
				return `mismatch in bid<->vset mapping at ${this.x2s(u)} ` +
					   `bid(${this.x2s(u)})=${this.x2s(this.bid(u))} ` +
					   `vset(${this.x2s(this.bid(u))})=` +
					   `${this.x2s(this.vset(this.bid(u)))}`;
		}
		// check that order of vertices in #outer matches order in #subs
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			let vs = this.vset(b);
			let u = super.firstIn(b);
			let v = this.firstIn(b);
			while (u == v && u != 0 && v != 0) {
				u = super.nextIn(b,u); v = this.nextIn(b,v);
			}
			if (u != v) {
				return 'inconsistent vertex ordering';
			}
		}
		return '';
	}
}
