/** @file Blossoms.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../../dataStructures/Top.mjs';
import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import Scanner from '../../dataStructures/basic/Scanner.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Forest from '../../dataStructures/trees/Forest.mjs';
import BalancedForest from '../../dataStructures/trees/BalancedForest.mjs';
import nca from '../misc/nca.mjs';

/** Data structure representing a collection of blossoms for use in
 *  Edmonds algorithm for weighted matching.
 */
export default class Blossoms extends Top {
	g;              // reference to client's graph
	match;          // reference to client's matching

	bsf;            // blossom structure forest defines hierarchy of
					// blossoms and sub-blossoms

	State;          // State[b] is state of outer blossom b; for inner
					// blossoms, State[b] is undefined
	Base;		    // if b is an outer blossom, Base[b] identifies the unique
					// vertex in b that has no matching edge with both
					// endpoints in b's vertex set
	Link;           // Link[b] is pair [v,e] where e is an edge incident to
					// b and v is the endpoint of e in b; if undefined: [0,0];
					// for an external blossom b, e is the edge to b's
					// tree parent; for an internal blossom, e is an edge to
					// next internal blossom in the blossom cycle of b's parent

	outerMethod;    // method used to compute outer: 0 for find root of bsf,
					// 1 for static map method, 2 find root of balanced forest
					// where each tree enumerates vertices in an outer blossom
	Outer;          // reference to data structure used to compute outer

    ids;            // list of available blossom ids (reduced by n)
	blist;          // temporary list used when forming new blossom

	steps;          // number of steps
	
	/** Constructor for Blossoms object.
	 *  @param g is the client's graph on which matching is computed
	 *  @param match is the client's matching object
	 */
	constructor(g, match, outerMethod=0) {
		super(g.n + ~~(g.n/2));
		this.g = g;
		this.match = match;
		this.outerMethod = outerMethod;

		this.bsf = new Forest(this.n);

		this.Base = new Int32Array(this.n+1);
		for (let i = 0; i <= this.g.n; i++) this.Base[i] = i;
		this.State = new Int32Array(this.n+1).fill(1);
		for (let e = match.first(); e != 0; e = match.next(e)) {
			this.State[this.g.left(e)] = 0;
			this.State[this.g.right(e)] = 0;
		}
		this.Link = new Array(this.n+1);
		for (let b = 1; b <= this.n; b++) this.Link[b] = [0,0];

		this.ids = new List(this.n - this.g.n);
		for (let b = g.n+1; b <= this.n; b++) this.ids.enq(b-this.g.n);
		this.blist = new List(this.n);

		if (this.outerMethod == 1) {
			this.Outer = new Int32Array(this.n+1);
			for (let b = 1; b <= this.n; b++) this.Outer[b] = b;
		} else if (this.outerMethod == 2) {
			this.Outer = {
				bf : new BalancedForest(this.n),
				bid : new Int32Array(this.n+1),
				root : new Int32Array(this.n+1)
			}
			for (let b = 1; b <= this.n; b++)
				this.Outer.bid[b] = this.Outer.root[b] = b;
		}

		this.steps = 0;
	}

	/** Assign new value to this from another. 
	 *  @param other is a Blossoms object
	 */
	assign(other) {
		if (other == this) return;
		if (other.g != this.g)
			this.reset(other.g, other.match, other.outerMethod);
		this.bsf.assign(other.subs);
		this.ids.assign(other.ids);
		for (let b = 0; b <= this.n; b++) {
			this.Base[b] = other.Base[b];
			this.State[b] = other.State[b];
			this.Link[b] = other.Link[b];
		}
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param other is another Blossoms object
	 */
	xfer(other) {
		if (other == this) return;
		this._n = other.n;
		this.g = other.g; this.match = other.match;
		this.ids = other.ids;
		this.State = other.State; this.Link = other.Link;
		other.g = other.match = null;
		other.subs = other.ids = other.State = other.Link = null;
	}
	
	/** Restore to initial state. */
	clear() {
		this.bsf.clear();
		this.ids.clear();
		for (let b = this.g.n+1; b <= this.n; b++) this.ids.enq(b-this.g.n);
		this.Base.fill(0);
		for (let u = 0; u <= this.g.n; u++) this.Base[u] = u;
		this.State.fill(1);
		for (let e = this.match.first(); e != 0; e = this.match.next(e)) {
			this.State[this.g.left(e)] = 0;
			this.State[this.g.right(e)] = 0;
		}
		this.Link;
		for (let u = 0; u <= this.n; u++) this.Link[u] = [0,0];
	}

	validBid(b) { return 0 <= b && b <= this.n &&
				  !this.ids.contains(b-this.g.n); }

	/** Get/set the base of a blossom.
	 *  @param b is the id of a blossom or sub-blossom
	 *  @param u is an optional vertex; if present the base of b is set to u.
	 *  @return the base of b
	 */
	base(b,u=-1) { if (u!=-1) this.Base[b] = u; return this.Base[b]; }

	/** Get/set the state of a blossom.
	 *  @param b is the id of a blossom or sub-blossom
	 *  @param s is an optional state (-1 for odd, +1 for even, 0 for unbound);
	 *  if present the base of b is set to s.
	 *  @return the state state of b
	 */
	state(b,s=-3) { if (s!=-3) this.State[b] = s; return this.State[b]; }

	/** Get/set the link of a blossom.
	 *  @param b is the id of a blossom or sub-blossom
	 *  @param p is a pair [v,e] where v is a vertex in b and e is an edge
	 *  incident to v but external to b; if p is present, the link of b
	 *  is set to p
	 *  @return the link of b
	 */
	link(b,p=-1) { if (p!=-1) this.Link[b] = p; return this.Link[b]; }

	/** Get the first outer blossom
Think about extending Forest to support firstTree, nextTree operations.
This would simplify interation through outer blossoms. Note, must account
for tree groups as well. Would it make sense to use a different name?
Say grove?
	 */
	firstOuter() {
		for (let b = 1; b <= this.n; b++) {
			if (this.parent(b)) continue;
			if (b <= this.g.n || !this.ids.contains(b-this.g.n))
				return b;
		}
		return 0; 
	}

	/** Get the next outer blossom.
	 *  @param b is an outer blossom
	 *  @return the next outer blossom following b
	 */
	nextOuter(b) {
		for (b++; b <= this.n; b++) {
			if (this.parent(b)) continue;
			if (b <= this.g.n || !this.ids.contains(b-this.g.n))
				return b;
		}
		return 0; 
	}

	/** Get the outer blossom containing a vertex or sub-blossom.
	 *  @param b is a blossom
	 *  @return the outer blossom containing b
	 */
	outer(b) {
		if (this.outerMethod == 0)
			return this.bsf.root(b);
		else if (this.outerMethod == 1)
			return this.Outer[b];
		else
			return this.Outer.bid[this.Outer.bf.root(b)];
	}

	/** Refresh the Outer array for the sub-blossoms of a
	 *  specified blossom (helper method).
	 *  @param b is an outer blossom; on return Outer[sb]=b for
	 *  all sub-blossoms sb of b
	 */
	refreshOuter(b) {
		for (let sb = this.bsf.first(b); sb; sb = this.bsf.next(sb)) {
			this.Outer[sb] = b; this.steps++;
		}
	}

	/** Get the first vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @return the first vertex in b
	 */
	firstIn(b) { return this.bsf.firstLeaf(b); }

	/** Get the last vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @return the last vertex in b
	 */
	lastIn(b) { return this.bsf.lastLeaf(b); }

	/** Get the next vertex in an outer blossom.
	 *  @param b is the id of an outer blossom
	 *  @param u is a vertex in b
	 *  @return the first vertex in b
	 */
	nextIn(b,u) { return this.bsf.nextLeaf(u,b); }

	/** Get the parent of a blossom in the blossom hierarchy.
	 *  @param b is a blossom id
	 *  @return the parent blossom of b in the blossom hierarchy, or 0
	 *  if b is an outer blossom
	 */
	parent(b) { return this.bsf.p(b); }

	/** Get the first sub-blossom of a given blossom.
	 *  @param b is a (possibly trivial) blossom
	 *  @return the first sub-blossom of b
	 */
	firstSub(b) { 
		if (this.ids.contains(b-this.g.n)) return 0;
		return this.bsf.firstChild(b);
	}

	/** Get the next sub-blossom.
	 *  @param s is a sub-blossom
	 *  @return the next sub-blossom of the parent blossom
	 */
	nextSub(s) { return this.bsf.nextSibling(s); }

	/** Get the size of a blossom.
	 *  @param B is a blossom
	 *  @return the number of vertices within B
	 */
	blossomSize(B) {
		let k = 0;
		for (let u = this.firstIn(B); u; u = this.nextIn(B,u))
			k++;
		return k;
	}

	/** Add a branch to a matching tree.
	 *  @param e is an outer edge
	 *  @param v is an endpoint of e in an unbound blossom
	 *  @param V (optional) is the outer blossom containing v
	 *  @return the even blossom added to the tree
	 */
	addBranch(e,v,V=this.outer(v)) {
		this.state(V,-1); this.link(V,[v,e]);
		let bV = this.base(V);
		let me = this.match.at(bV);
		let w = this.g.mate(bV,me); let W = this.outer(w);
		this.state(W,+1); this.link(W,[w,me]);
		return W;
	}
	
	/** Add a new outer blossom.
	 *  @param e is an edge
	 *  @param A is outer blossom that is the nearest common ancestor
	 *  of the outer blossoms containing e's endpoints
	 *  @return tuple [B, subs, U] where B is the id of the new blossom and
	 *  subs is a List of the sub-blossoms in B and U is the first sub-blossom
	 *  in subs that contains an endpoint of e
	 */
	addBlossom(e, A) {
		// initialize
		let u = this.g.left(e);  let U = this.outer(u);
		let v = this.g.right(e); let V = this.outer(v);
		let Alink = this.link(A); // save for later use

		// first, create ordered list of sub-blossoms of new blossom
		// using link values
		let subs = this.blist; subs.clear();
		let B = U;
		while (B != A) {
			subs.push(B);		// adds B to front of subs
			let [x,ee] = this.link(B);
			B = this.outer(this.g.mate(x,ee));
			this.steps++;
		}
		subs.push(A);
		B = V;
		while (B != A) {
			subs.enq(B);		// adds B to end of subs
			let [x,ee] = this.link(B);
			B = this.outer(this.g.mate(x,ee));
			this.steps++;
		}

		// now, re-direct the links for sub-blossoms on the "left sub-cycle";
		// undefine sub-blossom state values while we're at it
		let firstPart = true;
		for (let B = subs.first(); B; B = subs.next(B)) {
			if (B == U) {
				this.link(B,[u,e]); firstPart = false;
			} else if (firstPart) {
				// reverse direction of links in first part of cycle
				let nextB = subs.next(B);
				let [x,ee] = this.link(nextB);
				this.link(B,[this.g.mate(x,ee),ee]);
			}
			this.state(B,-2);	// -2 means undefined
		}
	
		// finally, use the list of sub-blossoms to construct blossom
		B = this.construct(subs);
		this.state(B, +1);
		this.link(B, Alink);
		return [B, subs, U];
	}

	/** Construct a blossom from a list (helper method).
	 *  @param subs is a list of outer blossoms
	 *  @return a new blossom obtained by combinining the blossoms in subs
	 */
	construct(subs) {
		let B = this.g.n + this.ids.deq();
		this.base(B, this.base(subs.first()));
		for (let b = subs.first(); b; b = subs.next(b)) {
			this.bsf.link(b,B);
		}

		if (this.outerMethod == 1) {
			this.refreshOuter(B);
		} else if (this.outerMethod == 2) {
			let bf = this.Outer.bf;
			let bid = this.Outer.bid;
			let root = this.Outer.root;

			bid[B] = root[B] = B;
			for (let b = subs.first(); b; b = subs.next(b)) {
				root[B] = bf.append(root[B],root[b]);
				bid[root[B]] = B;
			}
		}
		return B;
	}

	/** Expand a non-trivial outer blossom.
	 *  @param b is an outer blossom to be expanded; the
	 *  states of the new outer blossoms become unbound,
	 *  with the possible exception of the first sub-blossom,
	 *  which is assigned a state of even, if it is unmatched;
	 *  also, the links of all new outer-blossoms becomes [0,0].
	 *  @return a reference to a list of the new outer blossoms,
	 *  resulting from the expansion; note, this list may be
	 *  modified by other method calls on this object, so it
	 *  should be used with care
	 */
	expand(B) {
		let [subs,bBsub] = this.deconstruct(B);
		// now set sub-blossom links to [0,0] and states to 0 or +1
		for (let b = subs.first(); b; b = subs.next(b)) {
			this.state(b, this.match.at(this.base(b)) ?  0 : +1);
			this.link(b,[0,0]); this.steps++;
		}
		return subs;
	}

	/** Expand a non-trivial odd outer blossom, while preserving
	 *  the positions of some of its sub-blossoms in the matching tree.
	 *  @param B is an odd blossom to be expanded
	 *  @return a reference to a list of the new outer blossoms, resulting
	 *  from the expansion and note, this list may be modified by other method
	 *  calls on this object, so it should be used with care
	 */
	expandOdd(B) {
		ea && assert(B > this.g.n && this.state(B) == '-1');
		let [subs,bBsub] = this.deconstruct(B);
			// bBsub is sub-blossom in subs that contained base(B) before B
			// B was deconstructed

		let [v] = this.link(B); let V = this.outer(v);
			// V is outer blossom incident to edge linking
			// to B's former tree parent

		// set states on even-length cycle segment from V to B and redirect
		// links if necessary; make other sub-blossoms unbound
		if (this.match.contains(this.link(V)[1])) {
			// reverse links on path from bBsub back to V
			let b = bBsub; let sb = -1;
			while (b != V) { // even length segment
				let pb = subs.prev(b) ? subs.prev(b) : subs.last();
				let [x,e] = this.link(pb);
				this.link(b,[this.g.mate(x,e),e]);
				this.state(b,sb); sb = -sb;
				b = pb;
			}
			b = subs.prev(b) ? subs.prev(b) : subs.last();
			while (b != bBsub) { // odd length segment
				this.link(b,[0,0]); this.state(b,0);
				b = subs.prev(b) ? subs.prev(b) : subs.last();
			}
		} else {
			let b = bBsub; let sb = -1;
			while (b != V) { // even length segment
				this.state(b,sb); sb = -sb;
				b = subs.next(b) ? subs.next(b) : subs.first(b);
			}
			b = subs.next(b) ? subs.next(b) : subs.first(b);
			while (b != bBsub) { // odd length segment
				this.link(b,[0,0]); this.state(b,0);
				b = subs.next(b) ? subs.next(b) : subs.first(b);
			}
		}
		this.link(V,this.link(B)); this.state(V,-1);
		return subs;
	}

	/** Deconstruct an outer blossom (helper method).
	 *  @param B is blossom to be deconstructed; sub-blossoms of B become
	 *  outer blossoms and blossom id for B is recycled; matching edges in B
	 *  are adjusted to be consistent with outer graph
	 *  @return a pair [subs,bBsub] where subs is a reference to a list
	 *  of the former sub-blossoms of B and bBsub is the new outer blossom
	 *  containing the original base of B;
	 */
	deconstruct(B) {
		let bB = this.base(B);
		let subs = this.blist; subs.clear();

		let b0 = this.firstSub(B);
		while (b0) {
			subs.enq(b0);
			this.bsf.cut(b0);		// remove b0 from B's list of sub-blossoms
			b0 = this.firstSub(B);
			this.steps++;
		}
		this.ids.enq(B-this.g.n); // return B to list of available ids

		if (this.outerMethod == 1) {
			for (let b = subs.first(); b; b = subs.next(b)) {
				this.refreshOuter(b); this.steps++;
			}
		} else if (this.outerMethod == 2) {
			let bf = this.Outer.bf;
			let bid = this.Outer.bid;
			let root = this.Outer.root;

			let next;
			for (let b = subs.first(); b; b = next) {
				next = subs.next(b);
				if (next) {
					let [t1,t2] = bf.split(next);			
					root[b] = t1; bid[t1] = b;
					bf.join(0,next,t2);
				} else {
					root[b] = bf.root(b); bid[root[b]] = b;
				}
				this.steps++;
			}
		}

		let bBsub = this.outer(bB); this.base(bBsub, bB);
		this.extendMatching(subs, bBsub);

		return [subs, bBsub];
	}

	/** Extend a matching to new outer blossoms formed when a
	 *  blossom is expanded (helper method).
	 *  @param subs is a List of new outer blossoms formed when a former
	 *  blossom B is expanded
	 *  @param bBsub is the former sub-blossom of B that contains its base;
	 *  the matching status of tree edges incident to blossoms in subs is
	 *  determined by starting at bBsub and alternating around the former
	 *  blossom cycle; the base values of the blossoms in subs are also
	 *  updated to be consistent with the new matching edges.
	 */
	extendMatching(subs, bBsub) {
		let sub = bBsub; let even = true; let first = true;
		while (first || sub != bBsub) {
			if (first) first = false;
			let next = (subs.next(sub) ? subs.next(sub) :
										 subs.first());
			let [v,e] = this.link(sub);
			if (this.match.contains(e))
				this.match.drop(e);
			if (!even) {
				this.match.add(e);
				this.base(sub, v);
				this.base(next, this.g.mate(v,e));
			}
			even = !even; sub = next;
		}
	}

	/** Revise the matching within a blossom to make it consistent
 	 *  with outer graph or parent blossom.
	 *  @param b is a blossom; on return, the matching edges within
	 *  b are consistent with base(b)
	 */
	rematch(b) {
		if (b <= this.g.n) return;
		let bb = this.base(b);
		while (this.parent(bb) != b) bb = this.parent(bb);
			// note: may be inefficient in worst case,
			// but ok if use of rematch is suitably limited
		let firstSub = this.firstSub(b);
		let first = true; let even = true; let next;
		for (let sub = bb; first || sub != bb; sub = next) {
			next = this.nextSub(sub) ? this.nextSub(sub) :
									   firstSub;
			if (first) first = false;
			let [u,e] = this.link(sub);
			if (even && this.match.contains(e)) {
				this.match.drop(e);
			}
			if (!even) {
				if (this.match.contains(e)) this.match.drop(e);
					// this needed to ensure consistency of match
				this.match.add(e);
				this.base(sub,u); this.rematch(sub);
				let v = this.g.mate(u,e);
				this.base(next,v); this.rematch(next);
			}
			even = !even;
		}
		this.base(bb,this.base(b)); this.rematch(bb);
	}

	/** Apply rematch to all outer blossoms */
	rematchAll() {
    	for (let B = this.firstOuter(); B; B = this.nextOuter(B)) {
       		this.rematch(B);
		}
	}

	/** Compute the nearest common blossom ancestor.
	 *  @return array ncba mapping each edge e in g to  ncba[e={u,v}],
	 *  which is the nearest common ancestor of u and v in the blossom
	 *  structure forest.
	 */
	ncba() {
		let ncba = new Int32Array(this.n+1);
		ncba = nca(this.bsf, this.g);
		return ncba;
	}

	/** Determine if two Blossoms objects are equal.
	 */
	equals(other) {
		if (other === this) return true;
		if (typeof other == 'string') {
			let s = other;
			other = new Blossoms(this.g, this.match);
			ea && assert(other.fromString(s), 
					'Blossoms.fromString cannot parse ' + s); 
			if (!other.fromString(s)) return s == this.toString();
		}
        if (!(other instanceof Blossoms)) return false;
		if (other.n != this.n) return false;
		if (this.ids.length != other.ids.length) return false;

		if (!this.g.equals(other.g)) return false;
		if (!this.match.equals(other.match)) return false;

		// establish mapping between blossom ids in this and other
		let bidmap = new Int32Array(this.n+1);
		let q = new List(this.n);
		for (let b = 1; b <= this.g.n; b++) {
			bidmap[b] = b; let pb = this.parent(b);
			if (pb && !bidmap[pb] && !q.contains(pb)) {
				bidmap[pb] = other.parent(b); q.enq(pb);
			}
		}
		// q now contains super-blossoms for which bidmap has been initialized
		while (!q.empty()) {
			let b = q.deq(); let pb = this.parent(b);
			if (pb && !bidmap[pb] && !q.contains(pb)) {
				bidmap[pb] = other.parent(bidmap[b]); q.enq(pb);
			}
		}
		// now verify that all blossoms have matching parents
		for (let b = 1; b <= this.g.n; b++) {
			if (b > this.g.n && this.ids.contains(b-this.g.n)) continue;
			if (bidmap[this.parent(b)] != other.parent(bidmap[b]))
				return false;
		}

		for (let b = 1; b <= this.n; b++) {
			if (b > this.g.n && this.ids.contains(b-this.g.n)) continue;
			let bb = bidmap[b];
			if (this.base(b)  != other.base(bb) ||
				this.state(b) != other.state(bb)) {
				return false;
			}
			let [v1,e1] = this.link(b); let [v2,e2] = other.link(bb);
			if (v1 != v2) return false;
			if (v1 && v2) {
				let g = this.g;
				if (!(((g.left(e1) == g.left(e2)) &&
						(g.right(e1) == g.right(e2))) ||
					 ((g.left(e1) == g.right(e2)) &&
						(g.right(e1) == g.left(e2))))) {
					return false;
				}
			}
		}
		return true;
	}

	/** Return a string representation of a Blossoms object.
	 *  The string includes a representation of the non-trivial outer blossoms
	 *  and a representation of the non-trivial alternating path trees.
	 */
	toString() {
		return `{${this.blossoms2string()} ${this.trees2string()}}`;
	}

	/** Return a string representation of a blossom.
	 *  Non-trivial blossoms shown as upper-case letters when possible.
	 */
	x2s(b) {
		return (b <= this.g.n ? this.g.x2s(b) : 
				(this.g.n > 26 ? ''+b :
						'-ABCDEFGHIJKLMNOPQRSTUVWXYZ'[b-this.g.n]));
	}

	/** Create a string representing an item on a path.
	 *  @param x is "left attachment point" of B when B is non-trivial
	 *  @param B is a blossom identifier
	 *  @param y is "right attachment point" of B when B is non-trivial
	 *  @return a string denoting B for use in a larger "path string";
	 *  nontrivial blossoms shown as 'x.B.y' where B is the blossom id,
	 *  x and y are its attachment points
	 */
	pathItem2string(x,B,y) {
		let ts = '';
		if (B > this.g.n && x) ts += this.x2s(x);
		ts += this.x2s(B);
		if (B > this.g.n && y) ts += this.x2s(y);
		return ts;
	}

	/** Create a string representation of one blossom.
	 *  @param b is a blossom
	 *  @param label is an optional function that returns a vertex label
	 *  @return a string that represents the tree

not used
	bloss2string(b, label=0) {
		let s = label(b);
		if (this.bsf.firstChild(b) == 0) return s;
		s += '[';
		for (let c = this.bsf.firstChild(b); c; c = this.bsf.nextSibling(c)) {
			if (c != this.bsf.firstChild(b)) s += ' ';
			s += this.bloss2string(c,label);
		}
		return s + ']';
	}
	 */

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

	/** Create a string version of the outer graph.  */
	outerGraph2string() {
		let og = new Graph(this.n, this.g.edgeRange);
		for (let e = this.g.first(); e; e = this.g.next(e)) {
			let [u,v] = [this.g.left(e),this.g.right(e)];
			let [U,V] = [this.outer(u),this.outer(v)];
			if (U != V && !og.findEdge(U,V)) og.join(U,V);
		}
		return og.toString(0,
					(e,u) => this.x2s(og.mate(u,e)),
					u => this.x2s(u));
	}
	
	/** Return a string representation of the outer trees.
	 *  @param if terse is true, don't show the links joining
	 *  non-trivial blossoms to their tree neighbors.
	 */
	trees2string(terse=0) {
		let tt = new Forest(this.n);
		for (let B = this.firstOuter(); B; B = this.nextOuter(B)) {
			if (!this.state(B)) continue;
			let [v,e] = this.link(B);
			if (v) {
				let w = this.g.mate(v,e); let W = this.outer(w);
				tt.link(B,W);
			}
		}
		return tt.toString(4,
					b => {
						let s = this.x2s(b);
						if (!terse) {
							let pb = tt.p(b);
							let [v,e] = this.link(b);
							if (v && (b > this.g.n || pb > this.g.n))
								s += `{${this.x2s(v)},` +
									 `${this.x2s(this.g.mate(v,e))}}`;
						}
						return s;
					});
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

	/** Create a string version of the outer graph.  */
	outerGraph2string() {
		let og = new Graph(this.n, this.g.edgeRange);
		for (let e = this.g.first(); e; e = this.g.next(e)) {
			let [u,v] = [this.g.left(e),this.g.right(e)];
			let [U,V] = [this.outer(u),this.outer(v)];
			if (U != V && !og.findEdge(U,V)) og.join(U,V);
		}
		return og.toString(0,
					(e,u) => this.x2s(og.mate(u,e)),
					u => this.x2s(u));
	}
	
	/** Return a string representation of the outer trees.
	 *  @param if terse is true, don't show the links joining
	 *  non-trivial blossoms to their tree neighbors.
	 */
	trees2string(terse=0) {
		let tt = new Forest(this.n);
		for (let B = this.firstOuter(); B; B = this.nextOuter(B)) {
			if (!this.state(B)) continue;
			let [v,e] = this.link(B);
			if (v) {
				let w = this.g.mate(v,e); let W = this.outer(w);
				tt.link(B,W);
			}
		}
		return tt.toString(4,
					b => {
						let s = this.x2s(b);
						if (!terse) {
							let pb = tt.p(b);
							let [v,e] = this.link(b);
							if (v && (b > this.g.n || pb > this.g.n))
								s += `{${this.x2s(v)},` +
									 `${this.x2s(this.g.mate(v,e))}}`;
						}
						return s;
					});
	}

	/** Return a string representation of the non-trivial blossoms.
	 *  @param if terse is true, don't show the links joining
	 *  non-trivial blossoms to their neighboring sub-blossoms.
	 */
	blossoms2string(terse=0) {
		return this.bsf.toString(4,
					b => {
						let pb = this.parent(b);
						if (b <= this.g.n || !pb) return this.x2s(b);
						let pred = (b == this.firstSub(pb) ?
										this.bsf.lastChild(pb) :
										this.bsf.prevSibling(b));
						let [v,e] = this.link(pred);
						let x = this.g.mate(v,e);
						let [y] = this.link(b);
						let s = this.pathItem2string(x,b,y);
						if (this.in(this.base(pb),b) && b != this.firstSub(pb))
							s += '!';
						return s;

/*
						let s = '';
						s += this.x2s(b);
						let pb = this.parent(b);
						if (pb) {
							if (this.in(this.base(pb),b))
								s += '!';
						}
						if (pb && !terse) {
							let next = this.nextSub(b) ? this.nextSub(b) :
													     this.firstSub(pb);
							if (b > this.g.n || next > this.g.n) {
								let [v,e] = this.link(b);
								let w = this.g.mate(v,e);
								s += `{${this.x2s(v)},${this.x2s(w)}}`;
							}
						}
						return s;
*/
					});
	}

	/** Determine if a vertex is in a blossom */
	in(u, b) {
		let sb = u;
		while (sb) {
			if (sb == b) return true;
			sb = this.parent(sb);
		}
		return false;
	}

	/** Initialize object from string. */
	fromString(s) {
		this.clear();
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		// scan blossom structure forest
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			if (!sc.verify('[')) return false;
			if (!this.nextBlossom(sc,0)) return false;
			if (!sc.verify(']')) return false;
		}
		// set base values, consistent with blossom structure and matching;
		// also state values
		for (let b = this.firstOuter(); b; b = this.nextOuter(b)) {
			if (b <= this.g.n) this.base(b, b);
			else this.base(b, this.firstIn(b));
			this.state(b,+1);
		}
		let matched = new Set();
		for (let e = this.match.first(); e; e = this.match.next(e)) {
			let [u,v] = [this.g.left(e), this.g.right(e)];
			let U = this.outer(u); let V = this.outer(v);
			if (U == V) continue;
			if (matched.has(U) || matched.has(V)) return false;
			matched.add(U); matched.add(V);
			this.base(U, u); this.base(V, v);
			this.state(U, 0); this.state(V, 0);
		}
		// scan alternating path forest
		if (!sc.verify('{')) return false;
		while (!sc.verify('}')) {
			if (!sc.verify('[')) return false;
			if (!this.nextTree(sc,0,true)) return false;
			if (!sc.verify(']')) return false;
		}
		return true;
	}

	/** Scan for next blossom (including sub-blossoms).
	 *  @param sc is a scanner
	 *  @param parent is the parent in the blossom structure tree of the
	 *  blossom about to be scanned.
	 *  @return the blossom scanned when successful, else 0
	 */
	nextBlossom(sc, parent) {
		// first get label for next blossom
		let bl = this.nextBlossLabel(sc);
		if (!bl) return 0;
		let [x,B,y] = bl;
        if (B > this.g.n) {
            if (!this.ids.contains(B-this.g.n)) return 0;
            this.ids.delete(B-this.g.n);
        }
        this.state(B,-2); // undefined
        if (parent) {
            this.bsf.link(B, parent);
        }
		if (B <= this.g.n) return bl;
		if (!sc.verify('(')) return 0;

		// recursive calls on sub-blossoms of b
		let cnt = 0;
		let subs = new List(this.n);
			// list of sub-blossoms with attachment points
		while (!sc.verify(')')) {
			let label = this.nextBlossom(sc, B);
			if (!label) return 0;
			let [x,sub,y] = label;
			subs.enq(sub); subs.value(sub,[x,y]);
			if (sc.verify('!')) ; // just ignore decorative bang
			cnt++;
		}
		if (cnt < 3 || !(cnt&1)) return 0;

		// complete links of sub-blossoms
		this.base(B,this.firstIn(B));
		for (let sub = this.firstSub(B); sub; sub = this.nextSub(sub)) {
			let next = this.nextSub(sub) ? this.nextSub(sub) :
										   this.firstSub(B);
			let [,u] = subs.value(sub); let [v]  = subs.value(next);
			if (!this.in(u,sub) || !this.in(v,next)) return 0;
			let e = this.g.findEdge(u,v);
			if (!e) return 0;
			this.link(sub, [u,e]);
		}
		return [x,B,y];
	}

	/** Look for string representing a blossom label, optionally with
	 *  "attachment points" (e.g., strings like aBc or 22.100.47).
	 *  @return a triple [x,b,y]; if b is a non-trivial blossom id,
	 *  either x and y are both zero, or they identify vertices in b
	 *  that attach to the edges linking b to its neighbors in a blossom
	 *  cycle; if b is a vertex, x = y = b.
	 */
	nextBlossLabel(sc) {
		let x = 0; let b = 0; let y = 0;
		sc.skipspace();
		let c = sc.nextchar(); sc.reset(-1);
		if (sc.isdigit(c)) {
			b = this.nextIndex(sc);
			if (Number.isNaN(b)) return 0;
			if (sc.verify('.',0)) {
				x = b;
				if (x > this.g.n) return false;
				b = this.nextIndex(sc);
				if (Number.isNaN(b) || b <= this.g.n) return 0;
				if (!sc.verify('.',0)) return 0;
				y = this.nextIndex(sc);
				if (Number.isNaN(y) || y > this.g.n) return 0;
			}
		} else if (sc.isupper(c)) {
			b = this.nextIndex(sc);
			if (Number.isNaN(b)) return 0;
		} else if (sc.islower(c)) {
			b = this.nextIndex(sc);
			if (Number.isNaN(b)) return 0;
			c = sc.nextchar(); sc.reset(-1);
			if (sc.isupper(c)) {
				x = b;
				b = this.nextIndex(sc);
				if (Number.isNaN(b)) return 0;
				c = sc.nextchar(); sc.reset(-1);
				if (!sc.islower(c)) return 0;
				y = this.nextIndex(sc);
				if (Number.isNaN(y)) return 0;
			}
		}
		if (b <= this.g.n) x = y = b;
		return [x,b,y];
	}


	/** Scan for next tree (including sub-trees).
	 *  @param sc is a scanner
	 *  @param parent is the parent in the alternating path tree of the
	 *  blossom/vertex about to be scanned.
	 *  @param is true if the blossom about to be scanned is an even distance
	 *  from the root of its tree
	 *  @return the tree scanned when successful, else 0
	 */
	nextTree(sc, parent, even) {
		let b = this.nextIndex(sc);
		if (Number.isNaN(b) || !this.valid(b) || b == 0) return 0;
		if (b > this.g.n) {
			if (this.ids.contains(b-this.g.n)) return 0;
		}
		this.state(b,even ? +1 : -1);
		let lnk = this.nextLink(sc);
		if (lnk == null) return 0;
		let [v,e] = lnk;
		if (v && !parent) return 0;
		if (parent) {
			if (b > this.g.n || parent > this.g.n) {
				if (!v) return 0;
				if (!this.in(v,b) || !this.in(this.g.mate(v,e),parent))
					return 0;
				this.link(b,[v,e]);
			} else {
				let ee = this.g.findEdge(b,parent);
				if (v) {
					if (v != b || e != ee) return 0;
				} else {
					this.link(b,[b,ee]);
				}
			}
		}
		if (!sc.verify('(')) return b;
		// recursive calls on childrent of b
		while (!sc.verify(')')) {
			if (!this.nextTree(sc, b, !even)) return 0;
		}
		return b;
	}

	/** Read an index value.
	 *  Upper-case letters are interpreted as blossom identifiers.
	 *  @param sc is a Scanner object
	 */
	nextIndex(sc) {
		sc.skipspace();
		let c = sc.nextchar();
		if (!c) return 0;
		if (c == '-') {
			return 0
		} else if (sc.islower(c)) {
			return c.charCodeAt(0) - ('a'.charCodeAt(0) - 1);
		} else if (sc.isupper(c)) {
			return c.charCodeAt(0) + this.g.n - ('A'.charCodeAt(0) - 1);
		} 
		sc.reset(-1);
		let u = sc.nextInt();
		if (Number.isNaN(u)) return -1;
		return u;
	}

	/** Return the next link, if there is one present. */
	nextLink(sc) {
		if (!sc.verify('{')) return [0,0];
		let v = sc.nextIndex();
		if (Number.isNaN(v) || !this.g.validVertex(v)) return null;
		if (!sc.verify(',')) return null;
		let w = sc.nextIndex();
		if (Number.isNaN(v) || !this.g.validVertex(w)) return null;
		if (!sc.verify('}')) return null;
		let e = this.g.findEdge(v,w);
		if (!e) return null;
		return [v,e];
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
			let [U,V] = [this.outer(u),this.outer(v)];
			if (U == V) continue;
			if (this.base(U) != u) {
				return `base ${this.x2s(this.base(U))} of outer blossom ` +
					   `${this.x2s(U)} does not match endpoint ` +
					   `${this.x2s(u)} of its matching edge ${this.g.e2s(e)}`;
			}
			if (this.base(V) != v) {
				return `base ${this.x2s(this.base(V))} of outer blossom ` +
					   `${this.x2s(V)} does not match endpoint ` +
					   `${this.x2s(v)} of its matching edge ${this.g.e2s(e)}`;
			}
		}

		// check that matching edges alternate around a blossom
		// and that links are consistent
		for (let b = 1; b <= this.n; b++) {
			let even = true;
			if (b <= this.g.n || this.ids.contains(b - this.g.n)) continue;
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
			let w = this.g.mate(v,e); let W = this.outer(w);
			if (this.state(W) == 0 || this.state(W) == this.state(b))
				return `state of blossom ${this.x2s(b)}'s tree parent ` +
					   `${this.x2s(W)} is not consistent. ` +
					   `(${this.state(b)},${this.state(W)})`;
		}
		return '';
	}

	getStats() {
		this.steps += this.bsf.getStats().steps;
		return { 'steps': this.steps };
	}
}
