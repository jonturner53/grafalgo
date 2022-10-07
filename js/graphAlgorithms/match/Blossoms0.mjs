/** @file Blossoms0.mjs
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
import Forest from '../../dataStructures/graphs/Forest.mjs';

/** Data structure representing a collection of blossoms for use in
 *  Edmonds algorithm for weighted matching.
 */
export default class Blossoms0 extends Top {
	g;             // reference to client's graph
	match;         // reference to client's matching

	#subs;          // hierarchy of blossoms and sub-blossoms

	#state;         // state[b] is state of blossom b
	#base;          // base[b] is base of blossom b
	#link;          // link[b] is pair [v,e] where e is edge incident to b and v
                    // is the endpoint of e in b

    #ids;           // list of available blossom ids (reduced by n)
	#blist;         // temporary list used when forming new blossom
	#elist;         // temporary list used by flip
	#mark;          // temporary path marks used by flip

	steps;			// number of steps
	
	/** Constructor for Blossoms object.
	 *  @param g is the client's graph on which matching is computed
	 *  @param match is the client's matching object
	 */
	constructor(g, match) {
		super(g.n + ~~(g.n/2)); this.#init(g,match);
	}

	#init(g, match, link) {
		this.g = g;
		this.match = match;

		this.#subs = new Forest(this.n);

		this.#base = new Int32Array(this.n+1);
		for (let i = 0; i <= this.g.n; i++) this.#base[i] = i;
		this.#state = new Int32Array(this.n+1).fill(1);
		for (let e = match.first(); e != 0; e = match.next(e)) {
			this.#state[this.g.left(e)] = 0;
			this.#state[this.g.right(e)] = 0;
		}
		this.#link = new Array(this.n+1).fill(null);;

		this.#ids = new List(this.n - this.g.n);
		for (let b = g.n+1; b <= this.n; b++) this.#ids.enq(b-this.g.n);
		this.#blist = new List(this.n);
		this.#elist = new List(this.g.edgeCapacity);
		this.#mark = new Array(this.n+1).fill(null);

		this.steps = 0;
	}

	/** Reset this. */
	reset(g, match) {
		this._n = g.n + ~~(g.n/2); this.#init(g, match);
	}

	/** Assign new value to this from another. 
	 *  @paran bloss is a Blossoms object
	 */
	assign(bloss) {
		if (bloss == this) return;
		if (bloss.g != this.g)
			this.reset(bloss.g, bloss.match, bloss.link);
		this.#subs.assign(bloss.subs);
		this.#ids.assign(bloss.ids);
		for (let b = 0; b <= this.n; b++) {
			this.#base[b] = bloss.#base[b];
			this.#state[b] = bloss.#state[b];
			this.#link[b] = bloss.#link[b];
			this.#mark[b] = bloss.#mark[b];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param bloss is another Blossom object
	 */
	xfer(bloss) {
		if (bloss == this) return;
		this._n = bloss.n;
		this.g = bloss.g; this.match = bloss.match;
		this.#ids = bloss.ids;
		this.#state = bloss.#state; this.#link = bloss.#link;
		this.#mark = bloss.#mark;
		bloss.g = bloss.match = null;
		bloss.subs = bloss.ids = bloss.#state = bloss.#link 
				   = bloss.#mark = null;
	}
	
	/** Restore to initial state. */
	clear() {
		this.#subs.clear();
		this.#ids.clear();
		for (let b = this.g.n+1; b <= this.n; b++) this.#ids.enq(b-this.g.n);
		this.#base.fill(0);
		for (let u = 0; u <= this.g.n; u++)
			this.#base[u] = u;
		this.#state.fill(1);
		for (let e = this.match.first(); e != 0; e = this.match.next(e)) {
			this.#state[this.g.left(e)] = 0;
			this.#state[this.g.right(e)] = 0;
		}
		this.#link.fill(null);
		this.#mark.fill(null);
	}

	validBid(b) { return 0 <= b && b <= this.n && !this.#ids.contains(b); }

	/** Get/set the base of a blossom.
	 *  @param b is the id of a blossom or sub-blossom
	 *  @param u is an optional vertex; if present the base of b is set to u.
	 *  @return the base of b
	 */
	base(b,u=-1) { if (u!=-1) this.#base[b] = u; return this.#base[b]; }

	state(b,s=-3) { if (s!=-3) this.#state[b] = s; return this.#state[b]; }

	link(b,p=-1) { if (p!=-1) this.#link[b] = p; return this.#link[b]; }

	/** Get the first outer blossom */
	firstOuter() {
		let b = this.#subs.firstTree();
		while (b > this.g.n && this.#ids.contains(b-this.g.n)) {
			b = this.#subs.nextTree(b); this.steps++;
		}
		return b; 
	}

	/** Get the next outer blossom */
	nextOuter(b) {
		b = this.#subs.nextTree(b);
		while (b > this.g.n && this.#ids.contains(b-this.g.n))
			b = this.#subs.nextTree(b); this.steps++;
		return b; 
	}

	/** Get the outer blossom containing a vertex or sub-blossom. */
	outer(b) { return this.#subs.root(b); }

	/** Get the first vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @return the first vertex in b
	 */
	firstIn(b) { return this.#subs.firstLeaf(b); }

	nextIn(b,u) { return this.#subs.nextLeaf(b,u); }

	/** Get the parent of a blossom in the blossom hierarchy.
	 *  @param b is a blossom id
	 *  @return the parent blossom of b in the blossom hierarchy, or 0
	 *  if b is an outer blossom
	 */
	parent(b) { return this.#subs.parent(b); }

	/** Get the first sub-blossom of a given blossom.
	 *  @param b is a (possibly trivial) blossom
	 *  @return the first sub-blossom of b
	 */
	firstSub(b) { 
		if (this.#ids.contains(b-this.g.n)) return 0;
		return this.#subs.firstChild(b);
	}

	/** Get the next sub-blossom.
	 *  @param s is a sub-blossom
	 *  @return the next sub-blossom of the parent blossom
	 */
	nextSub(s) { return this.#subs.nextSibling(s); }

	/** Add a branch to a matching tree.
	 *  @param e is an equality edge
	 *  @param v is an endpoint of e in an unreached blossom
	 *  @param bv (optional) is the blossom containing v
	 *  @return the even blossom added to the tree
	 */
	addBranch(e,v,bv=this.outer(v)) {
		this.state(bv,-1); this.link(bv,[v,e]);
		let bbv = this.base(bv);
		let ee = this.match.at(bbv);
		let w = this.g.mate(bbv,ee); let bw = this.outer(w);
		this.state(bw,+1); this.link(bw,[w,ee]);
		return bw;
	}

	_pathmark(u) { return this.#mark[u] ; }

	/** Compute path marks to guide flip recursion.
	 *  @param bu is a blossom
	 *  @param u is a vertex within bu; on return, for each
	 *  sub-blossom b of bu containing u, #mark[b] is
	 *  the sub-blossom of b that contains u; for every other
	 *  sub-blossom b of bu, if b is on the even-length portion
	 *  of its parent's blossom cycle, #mark[b] is the endpoint
	 *  in b of the non-matching edge in the even length part of
	 *  the blossom cycle of b's parent.
Still, not quite complete. Better way to say this?
	 */
	#markpath(bu,u) {
		if (bu == u) return;
		let sbu = u;
		while (sbu != bu) {
			this.steps++;
			let pbu = this.parent(sbu);
			let even = !this.match.contains(this.link(sbu)[1]);
			this.#mark[pbu] = sbu;
			// call markpath on blossoms on even path
			if (even) {
				// even sub-cycle goes from first sub-blossom to sbu
				for (let b = this.firstSub(pbu); b!=sbu; b = this.nextSub(b)) {
					let [v,e] = this.link(b);
					if (this.match.contains(e)) continue;
					this.#markpath(b,v);
					this.#markpath(this.nextSub(b), this.g.mate(v,e));
				}
			} else {
				// even sub-cycle goes from sbu back to first sub-blossom
				for (let b = sbu; b != 0; b = this.nextSub(b)) {
					let [v,e] = this.link(b);
					if (this.match.contains(e)) continue;
					if (b != sbu) this.#markpath(b,v);
					let next = (this.nextSub(b) ? this.nextSub(b) :
												  this.firstSub(pbu));
					this.#markpath(next, this.g.mate(v,e));
				}
			}
			sbu = pbu;
		}
	}

/*
What if we generated a reversible list of the edges on the path,
as in the unweighted case, but using the sub-blossom structure
in place of the bridge info? Might this simplify the flipping?

Maybe we could do the sub-blossom marking in the process?

Perhaps I am over-thinking it. This started with trying to
generate the string representing the augmenting path. Perhaps
it's better just to show the augmenting path connecting the
outer blossoms. The new blossom is shown at the top of the main
loop. Perhaps that's enough.
*/
				
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
	flip(bu,u,nextVertex=0) {
		if (bu <= this.g.n) return;
		// let sbu be the sub-blossom of bu that contains u
		if (this.parent(bu) == 0) {
			this.#markpath(bu,u);
			nextVertex = 0;
		}
		this.steps++;

		let sb0 = this.firstSub(bu); let sbu = this.#mark[bu];
		let even = !this.match.contains(this.link(sbu)[1]);

		// for each sub-blossom sb on even path connecting sb0 and sbu
		//    flip sb at endpoint of unmatched edge on cycle incident to sb
		//    also reverse  matching status of blossom edges
		if (sbu == sb0) {
			this.flip(sb0, u, this.base(this.nextSub(sb0)));
		} else if (even) {
			// even path from sb0 to sbu
			let x = 0; let sb = sb0; let lnk = this.link(sb);
			while (sb != sbu) {
				this.steps++;
				let [y,e] = lnk; let nsb = this.nextSub(sb);
				if (this.match.contains(e)) {
					this.flip(sb, x, this.base(nsb));
					this.match.drop(e);
				} else {
					this.flip(sb, y, this.base(nsb));
					this.match.add(e);
				}
				x = this.g.mate(y,e); sb = nsb; lnk = this.link(sb);
			}
			let nsb = this.nextSub(sbu);
			this.flip(sbu, u, nsb ? this.base(nsb) : nextVertex);
		} else {
			// even path from sbu around to sb0
			let x = u; let sb = sbu; let lnk = this.link(sb);
			while (sb != 0) {
				this.steps++;
				let [y,e] = lnk; let nsb = this.nextSub(sb);
				if (this.match.contains(e)) {
					this.flip(sb, x, this.base(nsb));
					this.match.drop(e);
				} else {
					this.flip(sb, y, nsb ? this.base(nsb) : nextVertex);
					this.match.add(e);
				}
				x = this.g.mate(y,e); sb = nsb; lnk = this.link(sb);
			}
			this.flip(sb0, x, this.base(this.nextSub(sb0)));
		}

		if (sb0 != sbu) this.#subs.rotate(sb0,sbu);
		this.base(bu,u);
		return;
	}
	
	/** Add a new outer blossom.
	 *  @param e is an edge
	 *  @param nca is outer blossom that is the nearest common ancestor
	 *  of the outer blossoms containing e's endpoints
	 *  @return pair [b, subs] where b is the id of the new blossom and
	 *  subs is a List of the sub-blossoms in b
	 */
	addBlossom(e, nca) {
		// initialize
		let u = this.g.left(e);  let bu = this.outer(u);
		let v = this.g.right(e); let bv = this.outer(v);
		let ncaLink = this.link(nca); // save for later use

		// first, create ordered list of sub-blossoms of new blossom
		// using link values
		let blist = this.#blist; blist.clear();
		let b = bu;
		while (b != nca) {
			blist.push(b);		// adds b to front of blist
			let [x,ee] = this.link(b);
			b = this.outer(this.g.mate(x,ee));
			this.steps++;
		}
		blist.push(nca);
		b = bv;
		while (b != nca) {
			blist.enq(b);		// adds b to end of blist
			let [x,ee] = this.link(b);
			b = this.outer(this.g.mate(x,ee));
		}

		// now, re-direct the links for sub-blossoms on the "left sub-cycle";
		// undefine sub-blossom state values while we're at it
		let firstPart = true;
		for (let b = blist.first(); b != 0; b = blist.next(b)) {
			if (b == bu) {
				this.link(b,[u,e]); firstPart = false;
			} else if (firstPart) {
				// reverse direction of links in first part of cycle
				let nextb = blist.next(b);
				let [x,ee] = this.link(nextb);
				this.link(b,[this.g.mate(x,ee),ee]);
			}
			this.state(b,-2);	// -2 means undefined
		}
	
		// finally, build the list of sub-blossoms and combine
		// trees corresponding to sub-blossoms
		let nub = this.construct(blist);
		this.state(nub, +1);
		this.link(nub, ncaLink);
		return [nub, blist];
	}

	/** Construct a blossom from a list.
	 *  @param blist is a list of outer blossoms
	 *  @return a new blossom obtained by combinining the blossoms in blist
	 */
	construct(blist) {
		let nub = this.g.n + this.#ids.deq();

		let b0 = blist.first();
		for (let b = b0; b != 0; b = blist.next(b))
			this.#subs.link(b,nub);
		this.base(nub, this.base(b0));

		return nub;
	}

	/** Expand a non-trivial outer blossom.
	 *  @param b is a blossom to be expanded; the
	 *  states of the new outer blossoms become unreached,
	 *  with the possible exception of the first sub-blossom,
	 *  which is assigned a state of even, if it is unmatched;
	 *  also, the links of all new outer-blossoms becomes null.
	 *  @return a reference to a list of the new outer blossoms,
	 *  resulting from the expansion; note, this list may be
	 *  modified by other method calls on this object, so it
	 *  should be used with care
	 */
	expandBlossom(b) {
		let blist = this.deconstruct(b);
		let sb0 = blist.first();
		this.link(sb0,null);
		this.state(sb0, this.match.at(this.base(sb0)) ? 0 : +1);
		for (let sb = blist.next(sb0); sb != 0; sb = blist.next(sb)) {
			this.state(sb,0); this.link(sb,null); this.steps++;
		}
		return blist;
	}

	/** Expand a non-trivial odd outer blossom, while preserving
	 *  the positions of some of its sub-blossoms in the matching tree.
	 *  @param b is an odd blossom to be expanded
	 *  @return a reference to a list of the new outer blossoms,
	 *  resulting from the expansion; note, this list may be
	 *  modified by other method calls on this object, so it
	 *  should be used with care
	 */
	expandInplace(b) {
		fassert(this.state(b) == '-1');
		let sb0 = this.firstSub(b);

		// find the sub-blossom of b containing its link terminus, u
		let [u,e] = this.link(b);
		let sbu = u;
		while (this.parent(sbu) != b) {
			sbu = this.parent(sbu); this.steps++;
		}

		// determine if sbu is at even position in list
		let even = !this.match.contains(this.link(sbu)[1]);

		// deconstruct the blossom
		let blist = this.deconstruct(b);

		// on even sub-cycle, update state and link
		// on odd sub-cycle, make sub-blossoms unreached
		if (even) {
			// even length path goes from sb0 to sbu.
			let newState = -1;
			for (let sb = sb0; sb != sbu; sb = blist.next(sb)) {
				this.state(sb,newState);
				newState = (newState == +1 ? -1 : +1);
				this.steps++;
			}
			for (let sb = blist.next(sbu); sb != 0; sb = blist.next(sb)) {
				this.state(sb,0); this.link(sb,null); this.steps++;
			}
		} else {
			// even path goes from sbu around and back to sb0
			let newState = -1; let plnk = null;
			for (let sb = sbu; sb != 0; sb = blist.next(sb)) {
				this.steps++;
				let lnk = this.link(sb);
				if (sb != sbu) {
					let [v,ee] = plnk;
					this.link(sb,[this.g.mate(v,ee),ee]);
				}
				this.state(sb,newState);
				newState = (newState == +1 ? -1 : +1);
				plnk = lnk;
			}
			if (sb0 != sbu) {
				let [v,ee] = plnk;
				this.link(sb0,[this.g.mate(v,ee),ee]);
				this.state(sb0,newState);
			}
			for (let sb = blist.next(sb0); sb != sbu; sb = blist.next(sb)) {
				this.state(sb,0); this.link(sb,null); this.steps++;
			}
		}
		this.link(sbu, this.link(b));
		this.state(sbu, this.state(b));
		return blist;
	}

	/** Deconstruct an outer blossom.
	 *  @param b is blossom to be deconstructed; sub-blossoms of b become
	 *  outer blossoms and blossom id for b is recycled; the sub-blossoms
	 *  of b are placed in #blist as a side effect
	 *  @return a list of the sub-blossoms
	 */
	deconstruct(b) {
		let blist = this.#blist; blist.clear();
		let sb0 = this.firstSub(b);
		while (sb0 != 0) {
			this.steps++;
			blist.enq(sb0);
			let sb1 = this.nextSub(sb0);
			this.#subs.cut(sb0);	// remove sb0 from b's list of sub-blossoms
			sb0 = this.firstSub(b);
		}
		this.#ids.enq(b-this.g.n); // return b to list of available ids
		return blist;
	}

	/** Determine if two Blossom objects are equal.
	 */
	equals(bloss) {
		if (bloss === this) return true;
		if (typeof bloss == 'string') {
			let s = bloss;
			bloss = new Blossoms(this.g, this.match); bloss.fromString(s); 
		}
        if (!(bloss instanceof Blossoms)) return false;
		if (bloss.n != this.n) return false;
		if (this.#ids.length != bloss.#ids.length) return false;

		if (!this.g.equals(bloss.g)) return false;
		if (!this.match.equals(bloss.match)) return false;

		// establish mapping between blossom ids in this and bloss
		let bidmap = new Int32Array(this.n);
		let q = new List(this.n);
		for (let b = 1; b <= this.g.n; b++) {
			bidmap[b] = b; let pb = this.parent(b);
			if (pb && !bidmap[pb] && !q.contains(pb)) {
				bidmap[pb] = bloss.parent(b); q.enq(pb);
			}
		}
		// q now contains super-blossoms for which bidmap has been initialized
		while (!q.empty()) {
			let b = q.deq(); let pb = this.parent(b)
			if (pb && !bidmap[pb] && !q.contains(pb)) {
				bidmap[pb] = bloss.parent(bidmap[b]); q.enq(pb);
			}
		}
		// now verify that all blossoms have matching parents
		for (let b = 1; b <= this.g.n; b++) {
			if (b > this.g.n && this.#ids.contains(b-this.g.n)) continue;
			if (bidmap[this.parent(b)] != this.parent(bidmap[b]))
				return false;
		}
			

		for (let b = 1; b <= this.n; b++) {
			if (b > this.g.n && this.#ids.contains(b-this.g.n)) continue;
			let bb = bidmap[b];
			if (this.base(b)  != bloss.base(bb) ||
				this.state(b) != bloss.state(bb)) {
				return false;
			}
			let l1 = this.link(b); let l2 = bloss.link(bb);
			if (l1 == null || l2 == null) {
				if (l1 != l2) return false;
			} else {
				let [v1,e1] = l1; let [v2,e2] = l2;
				if (v1 != v2) return false;
				let g = this.g;
				if (!(((g.left(e1) == g.left(e2)) &&
						(g.right(e1) == g.right(e2))) ||
					 ((g.left(e1) == g.right(e2)) &&
						(g.right(e1) == g.left(e2)))))
					return false;
			}
		}
		return true;
	}

	/** Create a string representation of Blossoms object.
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(details=0, pretty=0, label=false) {
		// first determine which outer blossoms to include in string
		// show all non-trivial blossoms, plus vertices in a blossom tree
		let showme = new Int8Array(this.n);
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			if (this.firstSub(b) > 0) showme[b] = true;
			if (this.link(b)) {
				showme[b] = true;
				let [v,e] = this.link(b);
				let p = this.g.mate(v,e);
				let bp = this.outer(p);
				showme[bp] = true;
			}
		}

		let s = '';
		if (pretty) s += 'outer blossoms:\n';
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			if (!showme[b]) continue;
			if (pretty) s += '    ';
			else if (s.length > 0) s += ' ';
			s += (this.state(b) < 0 ? '-' : (this.state(b) > 0 ? '+' : '.'));
			s += this.#subs.tree2string(b,
					bb => this.x2s(bb) + this.link2string(bb));
			if (pretty) s += '\n'; // one outer blossom per line
		}
		s = (pretty ? s : '{' + s + '}');

		return s;
	}

	/** Return a string representation of a link. */
	link2string(b) {
		if (!this.link(b)) return '';
		let [v,e] = this.link(b);
	    let w = this.g.mate(v,e);
        let s = `(${this.x2s(v)},${this.x2s(w)})`;
		if (!this.parent(b))
			s += this.x2s(this.outer(w));
        return s;
	}

	/** Initialize object from string. */
	fromString(s) {
		let sc = new Scanner(s);
		this.clear();
		if (!sc.verify('{')) return false;
		while (true) {
			if (sc.verify('+')) {
				let b = this.nextBlossom(sc,0);
				if (!b) return false;
				this.state(b,+1);
			} else if (sc.verify('-')) {
				let b = this.nextBlossom(sc,0);
				if (!b) return false;
				this.state(b,-1);
			} else if (sc.verify('.')) {
				let b = this.nextBlossom(sc,0);
				if (!b) return false;
				this.state(b,0);
			} else {
				break;
			}
		}
		if (!sc.verify('}')) return false;
		return true;
	}
	
	/** Scan for a blossom.
	 *  @param sc is a Scanner object
	 *  @param parent is the parent of the blossom to be scanned.
	 *  @return the index of the scanned blossom or 0 if sc's
	 *  string does not start with a valid blossom representation.
	 */
	nextBlossom(sc, parent) {
		let b = sc.nextIndex();
		if (Number.isNaN(b) || !this.valid(b) || b == 0) return 0;
		if (b > this.g.n) {
			if (this.#ids.contains(b-this.g.n))
				this.#ids.delete(b-this.g.n);
		}
		if (this.parent(b) != 0) return 0;
		if (parent) {
			this.#subs.link(b, parent);
			this.state(b,-2);
		}
		this.link(b, this.nextLink(sc,parent));
		if (!sc.verify('[')) {
			if (parent && b == this.firstSub(parent))
				this.base(parent, this.base(b));
			return b <= this.g.n ? b : 0;
		}
		while (this.nextBlossom(sc, b)) {}
		if (!sc.verify(']')) return 0;
		if (parent && b == this.firstSub(parent))
			this.base(parent, this.base(b));
		return b;
	}

	nextLink(sc, parent) {
		if (!sc.verify('(')) return null;
		let v = sc.nextIndex();
		if (Number.isNaN(v) || !this.g.validVertex(v)) return null;
		if (!sc.verify(',')) return null;
		let w = sc.nextIndex();
		if (Number.isNaN(v) || !this.g.validVertex(w)) return null;
		if (!sc.verify(')')) return null;
		let e = this.g.findEdge(v,w);
		if (!e) return null;
		if (!parent) {
			let bw = sc.nextIndex();
			if (Number.isNaN(bw) || !this.valid(bw)) return null;
			if (bw <= this.g.n && bw != w) return null;
		}
		return [v,e];
	}

	x2s(b) {
		return (b <= this.g.n ? this.g.x2s(b) : ''+b);
	}

	/** Verify that object is consistent. */
	verify() {
		// check that matching is consistent
		let s = this.match.verify();
		if (s) return s;
		// check that base of each blossom is its leftmost descendant
		for (let b = 1; b <= this.n; b++) {
			if (b <= this.g.n && this.base(b) != b)
				return `base of trivial blossom ${this.x2s(b)} is incorrect`;
			if (b > this.g.n && !this.#ids.contains(b - this.g.n)) {
				let fb;
				for (fb = this.firstSub(b); this.firstSub(fb) != 0;
					 fb = this.firstSub(fb)) {}
				if (this.base(b) != fb)
					return `base of blossom ${this.x2s(b)} is incorrect` +
						   `${this.x2s(this.base(b))}`;
			}
		}
		// check that matching edges alternate around a blossom
		// and that links are consistent
		for (let b = 1; b <= this.n; b++) {
			let even = true;
			if (b <= this.g.n || this.#ids.contains(b - this.g.n)) continue;
			for (let sub = this.firstSub(b); sub!=0; sub = this.nextSub(sub)) {
				let [v,e] = this.link(sub);
				if (v != this.g.left(e) && v != this.g.right(e))
					return `link [${this.x2s(v)},${this.g.e2s(e)}] of ` +
						   `blossom ${this.x2s(b)} is incorrect.`
				if (even && this.match.contains(e))
					return `link [${this.x2s(v)},${this.g.e2s(e)}] of blossom` +
						   `${this.x2s(b)} should not be a matching edge`;
				if (!even && !this.match.contains(e))
					return `link [${this.x2s(v)},${this.g.e2s(e)}] of blossom` +
						   `${this.x2s(b)} should be a matching edge`;
				// check that v is in sub
				let bv;
				for (bv = v; bv != 0 && bv != sub; bv = this.parent(bv)) {}
				if (bv != sub)
					return `link [${this.x2s(v)},${this.g.e2s(e)}] of ` +
						   `blossom ${this.x2s(b)} is incorrect.`
				// check that mate(v,e) is in next sub-blossom
				let w = this.g.mate(v,e);
				let next = this.nextSub(sub) ? this.nextSub(sub) :
											   this.firstSub(b);
				let bw;
				for (bw = w; bw != 0 && bw != next; bw = this.parent(bw)) {}
				if (bw != next)
					return `link [${this.x2s(v)},${this.g.e2s(e)}] of ` +
						   `blossom ${this.x2s(b)} is inconsistent with ` +
						   `next blossom ${this.x2s(next)}.`
				even = !even;
			}
			if (even) 
				return `blossom ${this.x2s(b)} has even number of edges.`;
		}

		// check that states of outer blossoms are consistent and that
		// links are consistent
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			if (this.state(b) == 0) {
				if (!this.link(b)) continue;
				return `unreached outer blossom ${this.x2s(b)} has link`;
			}
			if (!this.link(b)) {
				if (this.state(b) != -1) continue;
				return `odd outer blossom ${this.x2s(b)} has no link`;
			}
			let [v,e] = this.link(b);
			if (v != this.g.left(e) && v != this.g.right(e))
				return `link [${this.x2s(v)},${this.g.e2s(e)}] of ` +
					   `blossom ${this.x2s(b)} is incorrect.`
			// check that v is in b
			let bv;
			for (bv = v; bv != 0 && bv != b; bv = this.parent(bv)) {}
			if (bv != b)
				return `link [${this.x2s(v)},${this.g.e2s(e)}] of ` +
					   `blossom ${this.x2s(b)} is incorrect.`
			let w = this.g.mate(v,e); let bw = this.outer(w);
			if (this.state(bw) == 0 || this.state(bw) == this.state(b))
				return `state of blossom ${this.x2s(b)}'s parent ` +
					   `${this.x2s(bw)} is not consistent.`;
		}
		return '';
	}

	getStats() {
		this.steps += this.#subs.getStats().steps;
		return { 'steps': this.steps };
	}
}
