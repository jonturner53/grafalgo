/** @file Blossoms.mjs
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
import BalancedForest from '../../dataStructures/graphs/BalancedForest.mjs';

const FAST = 0;		// flag used to enable faster outer computation

/** Data structure representing a collection of blossoms for use in
 *  Edmonds algorithm for weighted matching.
 */
export default class Blossoms extends Top {
	g;             // reference to client's graph
	match;         // reference to client's matching

	#subs;          // hierarchy of blossoms and sub-blossoms

	#state;         // state[b] is state of blossom b
	#base;          // base[b] is endpoint of a b's external matching edge or 0
	#link;          // link[b] is pair [v,e] where e is edge incident to b and v
                    // is the endpoint of e in b; if undefined: [0,0]

	#outerMethod;	// method used to compute outer: 0 for simple, 1 for trees
	#outer;			// reference to data structure used to compute outer

    #ids;           // list of available blossom ids (reduced by n)
	#blist;         // temporary list used when forming new blossom

	steps;			// number of steps
	
	/** Constructor for Blossoms object.
	 *  @param g is the client's graph on which matching is computed
	 *  @param match is the client's matching object
	 */
	constructor(g, match, outerMethod=0) {
		super(g.n + ~~(g.n/2));
		this.g = g;
		this.match = match;
		this.#outerMethod = outerMethod;

this.cnt = 0;
		this.#subs = new Forest(this.n);

		this.#base = new Int32Array(this.n+1);
		for (let i = 0; i <= this.g.n; i++) this.#base[i] = i;
		this.#state = new Int32Array(this.n+1).fill(1);
		for (let e = match.first(); e != 0; e = match.next(e)) {
			this.#state[this.g.left(e)] = 0;
			this.#state[this.g.right(e)] = 0;
		}
		this.#link = new Array(this.n+1);
		for (let b = 1; b <= this.n; b++) this.#link[b] = [0,0];

		this.#ids = new List(this.n - this.g.n);
		for (let b = g.n+1; b <= this.n; b++) this.#ids.enq(b-this.g.n);
		this.#blist = new List(this.n);

		if (this.#outerMethod == 1) {
			this.#outer = new Int32Array(this.n+1);
			for (let b = 1; b <= this.n; b++) this.#outer[b] = b;
		} else if (this.#outerMethod == 2) {
			this.#outer = {
				bf : new BalancedForest(this.n),
				bid : new Int32Array(this.n+1),
				root : new Int32Array(this.n+1)
			}
			for (let b = 1; b <= this.n; b++)
				this.#outer.bid[b] = this.#outer.root[b] = b;
		}

		this.steps = 0;
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
		bloss.g = bloss.match = null;
		bloss.subs = bloss.ids = bloss.#state = bloss.#link = null;
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
		this.#link;
		for (let u = 0; u <= this.n; u++) this.#link[u] = [0,0];
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
		for (let b = 1; b <= this.n; b++) {
			if (this.parent(b)) continue;
			if (b <= this.g.n || !this.#ids.contains(b-this.g.n))
				return b;
		}
		return 0; 
	}

	/** Get the next outer blossom */
	nextOuter(b) {
		for (b++; b <= this.n; b++) {
			if (this.parent(b)) continue;
			if (b <= this.g.n || !this.#ids.contains(b-this.g.n))
				return b;
		}
		return 0; 
	}

	/** Get the outer blossom containing a vertex or sub-blossom. */
	outer(b) {
		if (this.#outerMethod == 0)
			return this.#subs.root(b);
		else if (this.#outerMethod == 1)
			return this.#outer[b];
		else
			return this.#outer.bid[this.#outer.bf.find(b)];
	}

	refreshOuter(b) {
		for (let sb = this.#subs.first(b); sb; sb = this.#subs.next(sb)) {
			this.#outer[sb] = b; this.steps++;
		}
	}

	/** Get the first vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @return the first vertex in b
	 */
	firstIn(b) { return this.#subs.firstLeaf(b); }

	lastIn(b) { return this.#subs.lastLeaf(b); }

	nextIn(b,u) { return this.#subs.nextLeaf(b,u); }

	/** Get the parent of a blossom in the blossom hierarchy.
	 *  @param b is a blossom id
	 *  @return the parent blossom of b in the blossom hierarchy, or 0
	 *  if b is an outer blossom
	 */
	parent(b) { return this.#subs.p(b); }

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
	 *  @param v is an endpoint of e in an unbound blossom
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
	
	/** Add a new outer blossom.
	 *  @param e is an edge
	 *  @param nca is outer blossom that is the nearest common ancestor
	 *  of the outer blossoms containing e's endpoints
	 *  @return tuple [b, subs, bu] where b is the id of the new blossom and
	 *  subs is a List of the sub-blossoms in b and bu is the first sub-blossom
	 *  in subs that contains an endpoint of e
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
	
		// finally, use the list of sub-blossoms to construct blossom
		let nub = this.construct(blist);
		this.state(nub, +1);
		this.link(nub, ncaLink);
		return [nub, blist, bu];
	}

	/** Construct a blossom from a list.
	 *  @param blist is a list of outer blossoms
	 *  @return a new blossom obtained by combinining the blossoms in blist
	 */
	construct(blist) {
		let nub = this.g.n + this.#ids.deq();
		this.base(nub, this.base(blist.first()));
		for (let b = blist.first(); b; b = blist.next(b)) {
			this.#subs.link(b,nub);
		}

		if (this.#outerMethod == 1) {
			this.refreshOuter(nub);
		} else if (this.#outerMethod == 2) {
			let bf = this.#outer.bf;
			let bid = this.#outer.bid;
			let root = this.#outer.root;

			bid[nub] = root[nub] = nub;
			for (let b = blist.first(); b; b = blist.next(b)) {
				root[nub] = bf.append(root[nub],root[b]);
				bid[root[nub]] = nub;
			}
		}

		return nub;
	}

	/** Expand a non-trivial outer blossom.
	 *  @param b is a blossom to be expanded; the
	 *  states of the new outer blossoms become unbound,
	 *  with the possible exception of the first sub-blossom,
	 *  which is assigned a state of even, if it is unmatched;
	 *  also, the links of all new outer-blossoms becomes [0,0].
	 *  @return a reference to a list of the new outer blossoms,
	 *  resulting from the expansion; note, this list may be
	 *  modified by other method calls on this object, so it
	 *  should be used with care
	 */
	expand(b) {
		let [blist,bb] = this.deconstruct(b);
		// now set sub-blossom links to [0,0] and states to 0 or +1
		for (let bi = blist.first(); bi; bi = blist.next(bi)) {
			this.state(bi, bi == bb && this.match.at(this.base(bi)) ?
							+1 : 0);
			this.link(bi,[0,0]); this.steps++;
		}
		return blist;
	}

	/** Expand a non-trivial odd outer blossom, while preserving
	 *  the positions of some of its sub-blossoms in the matching tree.
	 *  @param b is an odd blossom to be expanded
	 *  @return a reference to a list of the new outer blossoms, resulting
	 *  from the expansion and note, blist may be modified by other method
	 *  calls on this object, so it should be used with care
	 */
	expandOdd(b) {
		fassert(b >= this.g.n && this.state(b) == '-1');
		let [blist,bbsub] = this.deconstruct(b);

		let [v] = this.link(b); let bv = this.outer(v);

		if (this.match.contains(this.link(bv)[1])) {
			// reverse links on path from bbsub back to bv
			let bi = bbsub; let sbi = -1;
			while (bi != bv) {
				let pbi = blist.prev(bi) ? blist.prev(bi) :
										   blist.last();
				let [x,e] = this.link(pbi);
				this.link(bi,[this.g.mate(x,e),e]);
				this.state(bi,sbi); sbi = -sbi;
				bi = pbi;
			}
			bi = blist.prev(bi) ? blist.prev(bi) :
                                      blist.last();
			while (bi != bbsub) {
				this.link(bi,[0,0]); this.state(bi,0);
				bi = blist.prev(bi) ? blist.prev(bi) :
									  blist.last();
			}
		} else {
			let bi = bbsub; let sbi = -1;
			while (bi != bv) {
				this.state(bi,sbi); sbi = -sbi;
				bi = blist.next(bi) ? blist.next(bi) :
									  blist.first(bi);
			}
			bi = blist.next(bi) ? blist.next(bi) :
								  blist.first(bi);
			while (bi != bbsub) {
				this.link(bi,[0,0]); this.state(bi,0);
				bi = blist.next(bi) ? blist.next(bi) :
									  blist.first(bi);
			}
		}
		this.link(bv,this.link(b)); this.state(bv,-1);
		return blist;
	}

	/** Deconstruct an outer blossom.
	 *  @param b is blossom to be deconstructed; sub-blossoms of b become
	 *  outer blossoms and blossom id for b is recycled; the sub-blossoms
	 *  of b are placed in #blist as a side effect
	 *  @return a pair [blist,bbsub] where blist is a reference to a list
	 *  of the new outer blossoms, resulting from the expansion and
	 *  base is the new outer blossom containing the original base of b;
	 */
	deconstruct(b) {
		let bb = this.base(b);
		let blist = this.#blist; blist.clear();

		let sb0 = this.firstSub(b);
		while (sb0 != 0) {
			blist.enq(sb0);
			this.#subs.cut(sb0);	// remove sb0 from b's list of sub-blossoms
			sb0 = this.firstSub(b);
			this.steps++;
		}
		this.#ids.enq(b-this.g.n); // return b to list of available ids

		if (this.#outerMethod == 1) {
			for (let b = blist.first(); b; b = blist.next(b)) {
				this.refreshOuter(b); this.steps++;
			}
		} else if (this.#outerMethod == 2) {
			let bf = this.#outer.bf;
			let bid = this.#outer.bid;
			let root = this.#outer.root;

			let next;
			for (let b = blist.first(); b; b = next) {
				next = blist.next(b);
				if (next) {
					let [t1,t2] = bf.split(next);			
					root[b] = t1; bid[t1] = b;
					bf.join(0,next,t2);
				} else {
					root[b] = bf.find(b); bid[root[b]] = b;
				}
				this.steps++;
			}
		}

		let bbsub = this.outer(bb); this.base(bbsub, bb)
		this.extendMatching(blist, bbsub);

		return [blist, bbsub];
	}

	/** Extend a matching to a blossom.
	 *  @param blist is a List of sub-blossoms of some blossom; matching
	 *  status is determined for edges in blist by starting at the
	 *  sub-blossom containing the blossom's base and alternating around
	 *  the blossom cycle; the base values of the sub-blossoms are also
	 *  updated to be consistent with the matching edges.
	 *  @param bbsub is the sub-blossom of b that contains the base of b
	 */
	extendMatching(blist, bbsub) {
		let sub = bbsub; let even = true; let first = true;
		while (first || sub != bbsub) {
			if (first) first = false;
			let next = (blist.next(sub) ? blist.next(sub) :
										  blist.first());
			let [v,e] = this.link(sub);
			if (this.match.contains(e))
				this.match.drop(e);
			if (!even) {
				this.match.add(e);
				this.base(sub, v);
				this.base(next, this.g.mate(v,e));
			}
			even = !even; sub = next;
			sub = next;
		}
	}

	/** Extend matching to a blossom or sub-blossom.
	 *  This is used at the end of execution to facilitate
	 *  verification of termination condition.
	 *  @param b is a non-trivial blossom
	extendMatchingRecursive(b) {
		let bb = this.base(b);
		let bbsub = bb;
		while (this.parent(bbsub) != b) bbsub = this.parent(bbsub);
		// so now, bbsub is the sub-blossom of b containing the base
		let sub = bbsub; let even = true; let first = true;
		while (first || sub != bbsub) {
			if (first) first = false;
			let next = (this.nextSub(sub) ? this.nextSub(sub) :
										    this.firstSub(b));
			let [v,e] = this.link(sub);
			if (this.match.contains(e))
				this.match.drop(e);
			if (!even) {
				this.match.add(e);
				this.base(sub, v);
				this.base(next, this.g.mate(v,e));
				extendMatchingRecursive(sub);
				extendMatchingRecursive(next);
			}
			even = !even; sub = next;
			sub = next;
		}
	}
	 */

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
			let b = q.deq(); let pb = this.parent(b);
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
			let [v1,e1] = this.link(b); let [v2,e2] = bloss.link(bb);
			if (v1 != v2) return false;
			if (v1 && v2) {
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
	 *  Shows all non-trivial blossoms plus blossoms in the matching forest.
	 *  @param fmt is an integer with low order bits specifying format optons
	 *    001 specifies a newline between succesive outer blossoms
	 *  @param label is an optional function that returns a text label
	 *  for an item
	 *  @return the string representation of the list
	 */
	toString(fmt=0) {
		// first determine which outer blossoms to include in string
		// show all non-trivial blossoms, plus vertices in a blossom tree
		let showme = new Int8Array(this.n);
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			if (this.firstSub(b) > 0) showme[b] = true;
			let [v,e] = this.link(b);
			if (v) {
				showme[b] = true;
				let p = this.g.mate(v,e);
				let bp = this.outer(p);
				showme[bp] = true;
			}
		}

		let s = '';
		for (let b = this.firstOuter(); b != 0; b = this.nextOuter(b)) {
			if (!showme[b]) continue;
			if (fmt) s += '    ';
			else if (s.length > 0) s += ' ';
			s += (this.state(b) < 0 ? '-' : (this.state(b) > 0 ? '+' : '.'));
			s += this.#subs.tree2string(b, fmt,
					bb => this.x2s(bb) + (b > this.g.n && bb == this.base(b) ? '*' : '') +
						  this.link2string(bb));
			if (fmt) s += '\n'; // one outer blossom per line
		}
		s = (fmt ? s : '{' + s + '}');

		if (this.#outerMethod == 1) {
			s += 'outer map\n'
			for (let b = 1; b <= this.n; b++) {
				if (this.validBid(b))
					s += ` ${this.x2s(b)}:${this.x2s(this.#outer[b])}`;
			}
			s += '\n';
		} else if (this.#outerMethod == 2) {
			s += 'outer trees: '
			s += this.#outer.bf.toString(0, b => this.x2s(b));
		}
		s += '\n';

		return s;
	}

	/** Return a string representation of a link. */
	link2string(b) {
		let [v,e] = this.link(b);
		if (!v) return '';
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
		//let s = this.match.verify();
		//if (s) return s;
		let s = '';
		// check that every matching edge is connected to the
		// base of its incident blossoms
		for (let e = this.match.first(); e; e = this.match.next(e)) {
			let [u,v] = [this.g.left(e),this.g.right(e)];
			let [bu,bv] = [this.outer(u),this.outer(v)];
			if (bu == bv) continue;
			if (this.base(bu) != u) {
				return `base ${this.x2s(this.base(bu))} of outer blossom ` +
					   `${this.x2s(bu)} does not match endpoint ` +
					   `${this.x2s(u)} of its matching edge ${this.g.e2s(e)}`;
			}
			if (this.base(bv) != v) {
				return `base ${this.x2s(this.base(bv))} of outer blossom ` +
					   `${this.x2s(bv)} does not match endpoint ` +
					   `${this.x2s(v)} of its matching edge ${this.g.e2s(e)}`;
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
			let [v,e] = this.link(b);
			if (this.state(b) == 0) {
				if (!v) continue;
				return `unbound outer blossom ${this.x2s(b)} has link`;
			}
			if (!v) {
				if (this.state(b) != -1) continue;
				return `odd outer blossom ${this.x2s(b)} has no link`;
			}
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
				return `state of blossom ${this.x2s(b)}'s tree parent ` +
					   `${this.x2s(bw)} is not consistent. ` +
					   `(${this.state(b)},${this.state(bw)})`;
		}
		return '';
	}

	getStats() {
		this.steps += this.#subs.getStats().steps;
		return { 'steps': this.steps };
	}
}
