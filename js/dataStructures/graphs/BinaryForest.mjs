/** @file BinaryForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

/** This class implements a generic binary tree class.
 *  It partitions the index set into multiple trees.
 */
export default class BinaryForest extends Top {
	#left;		// #left[u] is left child of u
	#right;		// #right[u] is right child of u
	#p;			// #p[u] is parent of u
	#roots;     // List of tree roots

	steps;      // total steps
	rotations;	// number of rotation operations

	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) {
		super(n);
		this.#left = new Int32Array(capacity+1);
		this.#right = new Int32Array(capacity+1);
		this.#p = new Int32Array(capacity+1);
		this.#roots = new List(capacity);
		this.#roots.addPrev();
		for (let u = 1; u <= this.n; u++) this.#roots.enq(u);
		this.clearStats();
	}

	/** Get the capacity of the object. */
	get capacity() { return this.#left.length-1; }

	expand(n) {
		let n0 = this.n;
		super.expand(n);
		for (let u = n0 + 1; u <= this.n; u++) this.#roots.enq(u);
	}

	/** Assign a new value by copying from another BinaryForest.
	 *  @param f is another BinaryForest
	 */
	assign(f) {
		if (f == this) return;
		if (!(f instanceof BinaryForest)) return;

		if (f.n != this.n) this.reset(f.n);
		else this.clear();
		this._n = f.n;

		this.#roots.assign(f.#roots);
		for (let u = 1; u <= f.n; u++) {
			this.left(u, f.left(u)); this.right(u, f.right(u));
			this.p(u, f.p(u));
			if (!this.p(u)) this.property(u, f.property(u));
		}
		this.clearStats();
	}

	/** Assign a new value by transferring from another BinaryForest.
	 *  @param f is another BinaryForest
	 */
	xfer(f) {
		if (f == this) return;
		if (!(f instanceof BinaryForest)) return;

		this._n = f.n;
		this.#left = f.#left; this.#right = f.#right; this.#p = f.#p;
		this.#roots = f.#roots;
		f.#left = f.#right = f.#p = f.#roots = null;
		this.clearStats();
	}
	
	/** Convert all nodes to singleton trees. */
	clear() {
		this.#left.fill(0); this.#right.fill(0); this.#p.fill(0);
		this.#roots.clear();
		for (let u = 1; u <= this.n; u++) {
			this.#roots.enq(u); this.steps++;
		}
		this.clearStats();
	}

	clearStats() { this.steps = this.rotations = 0; }

	/* Get or set the left child of a node.
	 * @param u is a node
	 * @param v is an optional new left child for u
	 * @return the left child of u
	 */
	left(u, v=-1) {
		if (v >= 0) this.#left[u] = v;
		return this.#left[u];
	}

	/* Get or set the right child of a node. */
	right(u, v=-1) {
		if (v >= 0) this.#right[u] = v;
		return this.#right[u];
	}

	/* Get or set the parent of a node. */
	p(u, v=-1) {
		if (v >= 0) this.#p[u] = v;
		return this.isroot(u) ? 0 : this.#p[u];
	}

	/* Get or set a property of a tree.
	 * @param t is a tree root
	 * @param p is an optional property to be assigned to the root;
	 * properties must be non-negative integers (Int32).
	 * @return the property of t
	 */
	property(t, p=-1) {
		fassert(this.isroot(t),
				`BinaryForest.property: ${this.x2s(t)} ${this.#p[t]}`);
		if (p >= 0) this.#p[t] = -p;
		return -this.#p[t]
	}

	/* Determine if a node is a tree root, */
	isroot(r) { return this.#p[r] <= 0; }

	/* Get the sibling of a node. */
	sibling(u) {
		let p = this.p(u);
		return (u == this.left(p) ? this.right(p) : this.left(p));
	}

	/** Get the child of a node that lies between it and its parent. */
	innerChild(u) {
		return (u == this.left(this.p(u)) ? this.right(u) : this.left(u));
	}

	/** Get the child of a node that is furthest from its parent. */
	outerChild(u) {
		return (u == this.left(this.p(u)) ? this.left(u) : this.right(u));
	}

	/** Get grandparent of a node. */
	gp(x) { return this.p(this.p(x)); }

	/** Get aunt of a node (parent's sibling) */
	aunt(x) { return this.sibling(this.p(x)); }

	/** Get nephew of a node (far child of sibling) */
	nephew(x) {
		return this.outerChild(this.sibling(x));
	}

	/** Get neice of a node (near child of sibling) */
	neice(x) {
		return this.innerChild(this.sibling(x));
	}

	/** Determine if node is an inner grandchild. */
	innerGrandchild(x) {
		let gp = this.gp(x);
		return x != 0 && (x == this.left(this.right(gp)) ||
						  x == this.right(this.left(gp))); 
	}

	/** Determine if node is an outer grandchild. */
	outerGrandchild(x) {
		let gp = this.gp(x);
		return x != 0 && (x == this.left(this.left(gp)) ||
						  x == this.right(this.right(gp))); 
	}

	/** Determine if node is a singleton. */
	singleton(u) {
		return this.isroot(u) && this.left(u) == 0 && this.right(u) == 0;
	}

	firstTree() { return this.#roots.first(); }
	nextTree(u) { return this.#roots.next(u); }

	// Methods for tree iteration. Iterates through nodes in "infix" order,
	// (that is, left-to-right). Note, iterating through a subtree of
	// of k nodes takes time proportional to k, although individual
	// steps may take more than constant time.

	/** Get the leftmost node in a subtree. */
	first(u) {
		while (this.left(u)) { u = this.left(u); this.steps++; }
		return u;
	}

	/** Get the next node to the right within a subtree. */
	next(u,root=0) {
		if (this.right(u)) return this.first(this.right(u));
		let c = u; u = this.p(u);
		while (u != this.p(root) && c == this.right(u)) {
			c = u; u = this.p(u); this.steps++;
		}
		return u != this.p(root) ? u : 0;
	}

	/** Get the rightmost node in a subtree. */
	last(u) {
		while (this.right(u)) { u = this.right(u); this.steps++; }
		return u;
	}

	/** Get the next node to the left within a subtree. */
	prev(u,root=0) {
		if (this.left(u) != 0) {
			for (u = this.left(u); this.right(u); u = this.right(u)) {
				this.steps++;
			}
			return u;
		}
		let c = u; u = this.p(u);
		while (u != this.p(root) && c == this.left(u)) {
			c = u; u = this.p(u); this.steps++;
		}
		return u != this.p(root) ? u : 0;
	}

	/** Find the root of the tree containing u. */
	find(u) {
		while (!this.isroot(u)) {
			u = this.p(u); this.steps++;
		}
		return u;
	}

	/** Remove a subtree.  */
	cut(u) {
		let pu = this.p(u);
		if (!this.isroot(u) && u == this.left(pu))  this.left(pu,0);
		if (!this.isroot(u) && u == this.right(pu)) this.right(pu,0);
		this.p(u,0);
		if (!this.#roots.contains(u)) this.#roots.enq(u);
		return u;
	}

	/** Link one tree to another.
	 *  @param u is a tree root or 0
	 *  @param v is a node in a different tree
	 *  @param side specifies which child of v that u should become;
	 *  -1 means left, +1 means right and 0 means don't care
	 */
	link(u,v,side=0) {
		if (this.#roots.contains(u)) this.#roots.delete(u);
		if (u) this.p(u,v);
		if (side < 0) {
			this.left(v,u);
		} else if (side > 0) {
			this.right(v,u);
		} else {
			if (this.left(v) && !this.right(v))
				this.right(v,u);
			else if (!this.left(v) && this.right(v))
				this.left(v,u);
			else if (Math.random() < 0.5)
				this.left(v,u);
			else
				this.right(v,u);
		}
	}

	/** Delete a node from a tree.
	 *  @param u is a non-singleton tree node.
	 *  @param post is an optional post-processing function;
	 *  if supplied, post(c,p) is called, where c is the
	 *  node that replaced u in the tree (or possibly 0) and p is
	 *  its parent.
	 */
	delete(u,post=false) {
		if (this.singleton(u)) return;
		if (this.left(u) != 0 && this.right(u) != 0)
			this.swap(u, this.prev(u)); 
		// now, u has at most one child
		let c = (this.left(u) ? this.left(u) : this.right(u));
		// c is now the only child that could be non-null
		let pc = this.p(u);
		if (c != 0) this.p(c, pc);
		if (pc == 0) {
			this.#roots.enq(c);
		} else {
				 if (u ==  this.left(pc))  this.left(pc, c);
			else if (u == this.right(pc)) this.right(pc, c);
			this.#roots.enq(u);
		}
		this.p(u,0); this.left(u,0); this.right(u,0);
		if (post !== false) post(c,pc);
	}

	/** Swap the positions of two nodes in same tree.
	 *  @param u is a node in the tree
	 *  @param v is another node in the same tree
	 */
	swap(u, v) {
		this.steps++;
		if (this.isroot(u) || this.isroot(v)) {
			if (!this.isroot(u)) {
				this.#roots.enq(u); this.#roots.delete(v);
			}
			if (!this.isroot(v)) {
				this.#roots.enq(v); this.#roots.delete(u);
			}
		}
		// save pointer fields for nodes u and v
		let lu = this.left(u); let ru = this.right(u);
		let lv = this.left(v); let rv = this.right(v);
		let pu = this.#p[u]; let pv = this.#p[v];
			// special handling of parent field to deal with tree property
	
		// fixup fields in u's neighbors
		if (lu != 0) this.p(lu, v);
		if (ru != 0) this.p(ru, v);
		if (!this.isroot(u)) {
			if (u == this.left(pu)) this.left(pu, v);
			else this.right(pu, v);
		}
		// fixup fields in j's neighbors
		if (lv != 0) this.p(lv, u);
		if (rv != 0) this.p(rv, u);
		if (!this.isroot(v) != 0) {
			if (v == this.left(pv)) this.left(pv, u);
			else this.right(pv, u);
		}
	
		// update fields in nodes u and v
		this.left(u, lv); this.right(u, rv); this.#p[u] = pv;
		this.left(v, lu); this.right(v, ru); this.#p[v] = pu;
	
		// final fixup for the case that u was originally the parent of v
			 if (v == lu) { this.left(v, u); this.p(u, v); }
		else if (v == ru) { this.right(v, u); this.p(u, v); }
	}

	/** Join two trees (or subtrees) at a node.
	 *  @param t1 is a tree
	 *  @param u is a node
	 *  @param t2 is a second tree
	 *  @return root of new tree (or subtree) making t1 the left subtree of u
	 *  and t2 the right subtree
	 */
	join(t1, u, t2) {
		if (t1 && this.isroot(t1)) this.#roots.delete(t1);
		if (t2 && this.isroot(t2)) this.#roots.delete(t2);
		this.link(t1,u,-1); this.link(t2,u,+1); this.p(u,0);
		return u;
	}

	/** Split a tree on a node.
	 *  @param u is a node in a tree
	 *  @return a pair [t1,t2] where t1 has the nodes that were to the
	 *  the left of u and t2 has the nodes that were to the right of u
	 */
	split(u) {
		fassert(this.valid(u));
		let v = u; let w = this.p(v);
		let [l,r] = [this.left(u), this.right(u)];
		while (w > 0) {
			this.steps++;
			let pw = this.p(w); // get this now, since join may change it
			if (v == this.left(w))  r = this.join(r, w, this.right(w));
			else			  		l = this.join(this.left(w), w, l);
			v = w; w = pw;
		}
		this.left(u,0); this.right(u,0);
		if (!this.isroot(u)) {
			this.p(u,0); this.#roots.enq(u);
		}
		if (l && !this.#roots.contains(l)) {
			this.p(l,0); this.#roots.enq(l);
		}
		if (r && !this.#roots.contains(r)) {
			this.p(r,0); this.#roots.enq(r);
		}
		return [l, r];
	}

	/** Append one tree after another
	 *  @param u is the root of tree
	 *  @param v is the root of a second tree
	 *  @return subtree formed by combining the two with the nodes
	 *  in v's subtree to the right of the nodes in u's subtree
	 */
	append(u,v) {
		if (u == 0 || u == v) return v;
		else if (v == 0) return u;
		let t = this.last(u);
		let [t1] = this.split(t);
		t = this.join(t1,t,v);
		if (this.#roots.contains(u)) this.#roots.delete(u);
		if (this.#roots.contains(v)) this.#roots.delete(v);
		if (!this.#roots.contains(t)) this.#roots.enq(t);
		return t;
	}

	// Balancing operations
	// In some applications, tree structure is important, while in others
	// only the left-to-right order of the nodes is. In the latter case
	// performance can often be improved by keeping subtrees "balanced".
	// Rotation operations are the basic balancing primitive. Applications
	// may use these in different ways.

	/** Perform a rotation in a tree.
	 *  @param x is a node in some tree; this method
	 *  moves x up into its parent's position
	 */
	rotate(x) {
		this.steps++; this.rotations++;
		let px = this.p(x); let gpx = this.#p[px];
		if (px == 0) return;
		let cx = 0;
		if (x == this.left(px)) {
			cx = this.right(x); this.left(px, cx); this.right(x, px);
		} else {
			cx = this.left(x); this.right(px, cx); this.left(x, px);
		}
		this.p(px, x); if (cx != 0) this.p(cx, px);
		if (gpx <= 0) {
			this.#roots.delete(px); this.#roots.enq(x);
		} else if (px == this.left(gpx)) {
			this.left(gpx, x);
		} else if (px == this.right(gpx)) {
			this.right(gpx, x);
		}
		this.#p[x] = gpx;
	}

	/** Perform a double-rotation on a tree.
	 *  @param x is a node in the tree; the operation moves x into
	 *  its grandparent's position. Note that this is not the same
	 *  as simply doing two successive rotations at x.
	 */
	rotate2(x) {
		if (this.outerGrandchild(x))  {
			this.rotate(this.p(x)); this.rotate(x); 
	    } else if (this.innerGrandchild(x)) {
			this.rotate(x); this.rotate(x); 
		}
	}

	/** Splay a search tree.
	 *  @param x is a tree node; the operation performs a series of rotations,
	 *  restructuring the tree; if used systematically, yields O(log n) time
	 *  per operation, on average
	 *  @return the root of the tree following the restructuring
	 */
	splay(x) {
		while (this.p(x)) {
			let y = this.p(x);
			if (y == 0) return;
			let z = this.p(y);
			if (z != 0) {
				if (this.outerGrandchild(x))
					this.rotate(y);
				else
					this.rotate(x);
			}
			this.rotate(x);
		}
		return x;
	}

	/** Determine if another BinaryForest are object is equal to this one.
	 *  @param bf is a BinaryForest object or a string representation of one.
	 *  @return true if the two objects contain the same trees (meaning
	 *  every node has the same parent in both objects).
	 */
	equals(other) {
		let bf = super.equals(other);
		if (typeof bf == 'boolean') return bf;
		for (let u = 1; u <= this.n; u++) {
			if (this.left(u) != bf.left(u) || this.right(u) != bf.right(u))
				return false;
				// p is assumed to be consistent with left and right
		}
		return bf;
	}

	/** Determine if two BinaryForest objects represent the same sets.
	 *  @param other is a BinaryForest object to be compared to this
	 *  @return true if both represent the same sets.
	 */
	setEquals(other) {
		let bf = super.equals(other);
		if (typeof bf == 'boolean') return bf;
		let l = new List(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			l.clear();
			for (let v = this.first(u); v; v = this.next(v)) l.enq(v);
			let len = 0;
			for (let v = bf.first(bf.find(u)); v; v = bf.next(v)) {
				if (!l.contains(v)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return bf;
	}

	/** Determine if two BinaryForest objects consist of
	 *  trees with nodes in the same left-to-right order (list equality).
	 *  @param other is a BinaryForest object to be compared to this
	 *  @return true or false if the equality status can be determined
	 *  without any further comparison of objects; otherwise return an
	 *  object that can be compared to this; two objects are considered
	 *  listEqual if their trees contain the same nodes and they appear
	 *  in the same order.
	 */
	listEquals(other) {
		let bf = super.equals(other);
		if (typeof bf == 'boolean') return bf;
		for (let u = 1; u <= this.n; u++) {
			if (this.p(u)) continue;
			let r1 = u; let r2 = bf.find(u);
			let v1 = this.first(r1); let v2 = bf.first(r2);
			while (v1 == v2 && v1 != 0) {
				v1 = this.next(v1,r1); v2 = bf.next(v2,r2);
			}
			if (v1 != v2) {
				return false;
			}
		}
		return bf;
	}
	
	/** Produce a string representation of the forest.
	 *  @param fmt is an integer with low-order bits specifying one
	 *  or more format options.
	 *    0b001 specifies newlines between trees
	 *    0b010 specifies that singletons are shown
	 *    0b100 specifies that the tree structure is shown
	 *  the default value is 0b100
	 *  @param label is a function that is used to label nodes
	 */
	toString(fmt=0x4, label=0) {
		if (!label) label = (u => this.x2s(u));
		let s = '';
		for (let u = this.firstTree(); u; u = this.nextTree(u)) {
			if (this.singleton(u) && !(fmt&0x2)) continue;
			if (!(fmt&0x1) && s) s += ' ';
			s += `${this.tree2string(u,fmt,label)}`;
			if (fmt&0x1) s += '\n';
		}
		return fmt&0x1 ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Recursive helper for constructing a string representation of a tree.
	 *  @param u is a node in one of the trees of the heap
	 *  @param treeRoot is true if h is the canonical element of the heap
	 *  @return the string
	 */
	tree2string(u, fmt, label=0, treeRoot=1) {
		if (u == 0) return (treeRoot ? '[-]' : ((fmt&0x4) ? '-' : ''));
		let s = '';
		if (this.left(u) == 0 && this.right(u) == 0) {
			s += label(u);
			return treeRoot ? '[' + s + ']' : s;
		}

		let sl = (this.left(u) || fmt&0x4) ?
					this.tree2string(this.left(u),fmt,label,0) : '';
		let sr = (this.right(u) || fmt&0x4) ?
					this.tree2string(this.right(u),fmt,label,0) : '';
		let lu = (fmt&0x4 && treeRoot ? '*' : '') + label(u);
		if (fmt&0x4 || (sl && lu && sr))
			s += sl + ' ' + lu + ' ' + sr;
		else if (sl) 
			s += sl + (lu ? ' ' + lu : '') + (sr ? ' ' + sr : '');
		else if (lu)
			s += lu + (sr ? ' ' + sr : '');
		return (treeRoot ? '[' + s + ']' : (fmt&0x4 ? '(' + s + ')' : s));
	}

	roots2string() { return this.#roots.toString(); }

	/** Initialize this BinaryForest object from a string,
	 *  like those produced by toString().
	 *  @param s is a string representing a forest.
	 *  @param prop is an optional function used to parse and
	 *  process node properties; if present, it is called just
	 *  after a node is identified; it is passed the node's index
	 *  and a reference to a Scanner object
	 *  @return true on success, else false
	 */
	fromString(s,prop=0) {
		let sc = new Scanner(s);
		if (!prop) { prop = ((u,sc) => 0); }
        if (!sc.verify('{')) return false;
		// scan input building parent mapping
        let pmap = [];
		while (!sc.verify('}')) {
			if (this.nextSubtree(sc, pmap, prop) < 0) return false;
		}
		let n = 0; let nodes = new Set();
		for (let [u,p] of pmap) {
			n = Math.max(n,u,p);
			if (nodes.has(u)) return false;
			nodes.add(u);
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let [u,p,side] of pmap) {
			if (side) this.link(u,p,side);
		}
		this.#roots.clear()
		for (let u = 1; u <= this.n; u++)
			if (!this.p(u)) this.#roots.enq(u);
		return true;
	}

	/** Scan for tree or subtree.
	 *  @param sc is a scanner
	 *  @param pmap is an array of pairs [u,p,side] representing a mapping
	 *  from a node u to its parent, with side specifying that u is the left
	 *  child (-1) or right child (+1); nextSubtree adds new mappings to pmap
	 *  @param treeRoot is a flag at the root of a tree.
	 */
	nextSubtree(sc, pmap, prop=0, treeRoot=1) {
		if (treeRoot) {
			if (!sc.verify('[')) return -1;
			let t1 = this.nextSubtree(sc, pmap, prop, 0);
			if (t1 < 0) return -1;
			let u = sc.nextIndex();
			if (u < 0) {
				pmap.push([0,t1,0]);  // special case for singleton tree
				if (!sc.verify(']')) return -1;
				return t1;
			}
			if (u > 0) prop(u,sc);
			let t2 = this.nextSubtree(sc, pmap, prop, 0);
			if (t2 < 0) return -1;
			if (!sc.verify(']')) return -1;
			if (t1 && u) pmap.push([t1,u,-1]);
			if (t2 && u) pmap.push([t2,u,+1]);
			return u;
		}
		if (sc.verify('(')) {
			let t1 = this.nextSubtree(sc, pmap, prop, 0);
			if (t1 < 0) return -1;
			let u = sc.nextIndex();
			if (u < 0) return -1;
			if (u > 0) prop(u,sc);
			let t2 = this.nextSubtree(sc, pmap, prop, 0);
			if (t2 < 0) return -1;
			if (!sc.verify(')')) return -1;
			if (t1 && u) pmap.push([t1,u,-1]);
			if (t2 && u) pmap.push([t2,u,+1]);
			return u;
		} else {
			let u = sc.nextIndex();
			if (u > 0) prop(u,sc);
			return u;
		}
	}

	/** Initialize this object from a string that represents a set of lists.
	 *  @param s is a string representing a heap.
	 *  @return on if success, else false
	 */
	fromListString(s, prop=0) {
		let ls = new ListSet(); ls.fromString(s, prop);
		if (ls.n != this.n) this.reset(ls.n);
		else this.clear();
		for (let u = 1; u <= this.n; u++) {
			if (!ls.isfirst(u)) continue;
			let r = u;
			for (let v = ls.next(r); v; v = ls.next(v)) {
				r = this.append(r,v); 
			}
		}
		return true;

	}

	/** Verify that object is self-consistent.
	 *  @return an error string if an inconsistency is found, else the
	 *  the empty string.
	 */
	verify() {
		if (this.left(0) || this.right(0) || this.p(0))
			return `null node has non-null neighbor`;
		for (let u = 1; u <= this.n; u++) {
			let pu = this.p(u);
			if (pu && this.#roots.contains(u))
				return `node ${this.x2s(u)} with parent ${this.x2s(pu)} in ` +
					   `root list`;
			if (!pu && !this.#roots.contains(u))
				return `node ${this.x2s(u)} with no parent missing from ` +
					   `root list`;
			if (pu) {
				if (u != this.left(pu) && u != this.right(pu))
					return `${this.x2s(u)} not a child of its parent ` +
						   `${this.x2s(pu)}`;
				let i = 0;
				for (let v = u; v; v = this.p(v)) {
					if (i++ > this.n)
						return `infinite parent loop from ${this.x2s(u)} ` +
					   		   `with ${this.x2s(v)}`;
				}
			}
			if (this.left(u) && this.p(this.left(u)) != u)
				return `left child ${this.x2s(this.left(u))} ` +
					   `of ${this.x2s(u)} has parent ` +
					   `${this.x2s(this.p(this.left(u)))}`;
			if (this.right(u) && this.p(this.right(u)) != u)
				return `right child ${this.x2s(this.right(u))} ` +
					   `of ${this.x2s(u)} has parent ` +
					   `${this.x2s(this.p(this.right(u)))}`;
		}
		return '';
	}

	/** Return statistics object. */
	getStats() {
		return { 'steps': this.steps, 'rotations': this.rotations };
	}
}
