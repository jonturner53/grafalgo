/** @file BinaryForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';

import { assert, assertEnabled as ae} from '../../common/Assert.mjs';

/** This class implements a generic binary tree class.
 *  It partitions the index set into multiple trees.
 */
export default class BinaryForest extends Top {
	left_;      // left_[u] is left child of u
	right_;     // right_[u] is right child of u
	parent_;    // parent_[u] is parent of u

	steps;      // total steps
	rotations;	// number of rotation operations

	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 */
	constructor(n=10, property=[]) {
		super(n);
		this.left_ = new Int32Array(this.n+1);
		this.right_ = new Int32Array(this.n+1);
		this.parent_ = new Int32Array(this.n+1);
		if (property[0]) this.addProperty(property);
		this.clearStats();
	}

	/** Clear trees in forest, leaving singletons.
	 *  @param r specifies the root of a tree (or subtree) to be cleared;
	 *  if zero, all trees are cleared.
	 */
	clear(r=0) {
		if (r) {
			this.clearHelper(r);
		} else {
			this.left_.fill(0); this.right_.fill(0); this.parent_.fill(0);
			this.steps += this.n;
		}
	}
	
	clearHelper(r) {
		this.steps++;
		if (this.left(r)) this.clearHelper(this.left(r));
		if (this.right(r)) this.clearHelper(this.right(r));
		this.cut(r);
	}

	clearStats() { this.steps = this.rotations = 0; }

//	valid(i) { return i >= 0 && i <= this.nodeRange; }

	/* Get or set the left child of a node.
	 * @param u is a node
	 * @param v is an optional new left child for u
	 * @return the left child of u
	 */
	left(u, v=-1) {
		if (v >= 0) this.left_[u] = v;
		return this.left_[u];
	}

	/* Get or set the right child of a node. */
	right(u, v=-1) {
		if (v >= 0) this.right_[u] = v;
		return this.right_[u];
	}

	/* Get or set the parent of a node. */
	parent(u, v=-1) {
		if (v >= 0) this.parent_[u] = v;
		return this.isroot(u) ? 0 : this.parent_[u];
	}

	/* Get or set a property of a tree.
	 * @param t is a tree root
	 * @param p is an optional property to be assigned to the root;
	 * properties must be non-negative integers (Int32).
	 * @return the treeProperty of t
	 */
	treeProperty(t, p=-1) {
		ae() && assert(this.isroot(t),
					 `BinaryForest.treeProperty: ${this.x2s(t)} ${p}`);
		if (p >= 0) this.parent_[t] = -p;
		return -this.parent_[t]
	}

	/* Determine if a node is a tree root, */
	isroot(r) {
		return this.valid(r) && (this.parent_[r] === undefined ||
								 this.parent_[r] <= 0);
	}

	/* Get the sibling of a node. */
	sibling(u) {
		let p = this.parent(u);
		return (u == this.left(p) ? this.right(p) : this.left(p));
	}

	/** Get the child of a node that lies between it and its parent. */
	innerChild(u) {
		return (u == this.left(this.parent(u)) ? this.right(u) : this.left(u));
	}

	/** Get the child of a node that is furthest from its parent. */
	outerChild(u) {
		return (u == this.left(this.parent(u)) ? this.left(u) : this.right(u));
	}

	/** Get grandparent of a node. */
	gparent(x) { return this.parent(this.parent(x)); }

	/** Get aunt of a node (parent's sibling) */
	aunt(x) { return this.sibling(this.parent(x)); }

	/** Get nephew of a node (far child of sibling) */
	nephew(x) {
		return this.outerChild(this.sibling(x));
	}

	/** Get niece of a node (near child of sibling) */
	niece(x) {
		return this.innerChild(this.sibling(x));
	}

	/** Determine if node is an inner grandchild. */
	innerGrandchild(x) {
		let gp = this.gparent(x);
		return x != 0 && (x == this.left(this.right(gp)) ||
						  x == this.right(this.left(gp))); 
	}

	/** Determine if node is an outer grandchild. */
	outerGrandchild(x) {
		let gp = this.gparent(x);
		return x != 0 && (x == this.left(this.left(gp)) ||
						  x == this.right(this.right(gp))); 
	}

	/** Determine if node is a singleton. */
	singleton(u) {
		return this.isroot(u) && this.left(u) == 0 && this.right(u) == 0;
	}

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
		let c = u; u = this.parent(u);
		while (u != this.parent(root) && c == this.right(u)) {
			c = u; u = this.parent(u); this.steps++;
		}
		return u != this.parent(root) ? u : 0;
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
		let c = u; u = this.parent(u);
		while (u != this.parent(root) && c == this.left(u)) {
			c = u; u = this.parent(u); this.steps++;
		}
		return u != this.parent(root) ? u : 0;
	}

	/** Find the root of the tree containing u. */
	root(u) {
		while (!this.isroot(u)) {
			u = this.parent(u); this.steps++;
		}
		return u;
	}

	/** Remove a subtree.  */
	cut(u) {
		let pu = this.parent(u);
		if (!this.isroot(u) && u == this.left(pu))  this.left(pu,0);
		if (!this.isroot(u) && u == this.right(pu)) this.right(pu,0);
		this.parent(u,0);
		return u;
	}

	/** Link one tree to another.
	 *  @param u is a tree root or 0
	 *  @param v is a node in a different tree
	 *  @param side specifies which child of v that u should become;
	 *  -1 means left, +1 means right and 0 means don't care
	 */
	link(u,v,side=0) {
		ae() && assert(v != 0);
		if (u) this.parent(u,v);
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
	
	/** Insert a node immediately after another vertex in a tree.
	 *  @param u is a singleton
	 *  @param v is a vertex in a tree which defines the point where u is
	 *  @param t is the tree root; if omitted, the tree containing v is used
	 *  to be inserted; if zero, u is inserted before all nodes in tree
	 *  @param refresh(u) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  just after u is inserted
	 *  @return the root of the resuling tree
	 */
	insertAfter(u, v, t=this.root(v), refresh=0) {
		ae() && assert(v || t, 
					 'BinaryForest:insertAfter: either v or t must be defined');
		if (t == u) return u;
		if (!v) {
			this.link(u, this.first(t), -1);
		} else if (!this.right(v)) {
			this.link(u, v, +1);
		} else {
			this.link(u, this.first(this.right(v)), -1);
		}
		if (refresh) refresh(u);
		return this.root(t);
	}

	/** Delete a node from a tree.
	 *  @param u is a non-singleton tree node.
	 *  @param t is the tree containing u
	 *  @param refresh(cu,pu) is an optional function which can be used
	 *  to adjust client data that is affected by the tree structure;
	 *  it is called just after u's removal and its arguments are u's former
	 *  child and parent
	 *  @return the resulting tree
	 */
	delete(u, t=0, refresh=0) {
		if (this.singleton(u)) return u;
		// find a node close to the root
		if (!t) t = this.root(u);
		let tt = (u != t ? t : (this.left(u) ? this.left(u) : this.right(u)));
		if (this.left(u) && this.right(u))
			this.swap(u, this.prev(u)); 
		// now, u has at most one child
		let cu = (this.left(u) ? this.left(u) : this.right(u));
		// cu is now the only child that could be non-zero
		let pu = this.parent(u);
		if (cu != 0) this.parent(cu, pu);
		if (pu != 0) {
				 if (u ==  this.left(pu))  this.left(pu, cu);
			else if (u == this.right(pu)) this.right(pu, cu);
		}
		this.parent(u,0); this.left(u,0); this.right(u,0);
		if (refresh) refresh(cu,pu);
		tt = this.root(tt);
		return tt;
	}

	/** Swap the positions of two nodes in same tree.
	 *  @param u is a node in the tree
	 *  @param v is another node in the same tree
	 */
	swap(u, v) {
		this.steps++;
		// save pointer fields for nodes u and v
		let lu = this.left(u); let ru = this.right(u);
		let lv = this.left(v); let rv = this.right(v);
		let pu = this.parent_[u]; let pv = this.parent_[v];
			// special handling of parent field to deal with tree property
	
		// fixup fields in u's neighbors
		if (lu != 0) this.parent(lu, v);
		if (ru != 0) this.parent(ru, v);
		if (!this.isroot(u)) {
			if (u == this.left(pu)) this.left(pu, v);
			else this.right(pu, v);
		}
		// fixup fields in j's neighbors
		if (lv != 0) this.parent(lv, u);
		if (rv != 0) this.parent(rv, u);
		if (!this.isroot(v) != 0) {
			if (v == this.left(pv)) this.left(pv, u);
			else this.right(pv, u);
		}
	
		// update fields in nodes u and v
		this.left(u, lv); this.right(u, rv); this.parent_[u] = pv;
		this.left(v, lu); this.right(v, ru); this.parent_[v] = pu;
	
		// final fixup for the case that u was originally the parent of v
			 if (v == lu) { this.left(v, u); this.parent(u, v); }
		else if (v == ru) { this.right(v, u); this.parent(u, v); }
	}

	/** Join two trees (or subtrees) at a node.
	 *  @param t1 is a tree
	 *  @param u is a node
	 *  @param t2 is a second tree
	 *  @param refresh(u) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  at the conclusion of the operation.
	 *  @return root of new tree making t1 the left subtree of u
	 *  and t2 the right subtree
	 */
	join(t1, u, t2, refresh=0) {
		this.link(t1,u,-1); this.link(t2,u,+1); this.parent(u,0);
		if (refresh) refresh(u);
		return u;
	}

	/** Split a tree on a node.
	 *  @param u is a node in a tree
	 *  @param refresh(u) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  at the conclusion of the split.
	 *  @return a pair [t1,t2] where t1 has the nodes that were to the
	 *  the left of u and t2 has the nodes that were to the right of u
	 */
	split(u, refresh=0) {
		ae() && assert(this.valid(u));
		let v = u; let p = this.parent(v);
		let [l,r] = [this.left(v), this.right(v)];
		while (p > 0) {
			this.steps++;
			let gp = this.parent(p); this.parent(p,0); // isolate p's subtree
			if (v == this.left(p)) {
				r = this.join(r,p,this.right(p),refresh);
			} else {
			  	l = this.join(this.left(p),p,l,refresh);
			}
			v = p; p = gp;
		}
		this.parent(l,0); this.parent(r,0);
		this.left(u,0); this.right(u,0); this.parent(u,0);
		if (refresh) refresh(u);
		return [l,r];
	}

	/** Insert a node based on a key value.
	 *  @param u is a singleton node
	 *  @param t is the root of some tree.
     *  @compare is an optional key comparison function
	 *  @param refresh(u) is an optional function that can be used to adjust
	 *  client data that is affected by the tree structure; it is called
	 *  just after u is inserted
	 *  @return the root of the modified tree
	 */
	insertByKey(u, t, compare=((a,b)=>a-b), refresh=0) {
		if (!t || t == u) return u;
		ae() && assert(this.key);
		let v = t; let pv = 0;
		while (v != 0) {
			pv = v; this.steps++;
			if (compare(this.key(u),this.key(v)) <= 0)
				v = this.left(v);
			else
				v = this.right(v);
		}
		this.link(u, pv, compare(this.key(u), this.key(pv)) <= 0 ? -1 : +1);
		if (refresh) refresh(u);
		return this.root(t);
	}

	/** Search for an item with a specified key
	 *  @param k is a specific key value to be located
	 *  @param t is the root of the tree (or subtree) to be searched
	 *  @return node u where key(u)==k or 0 if there is no such node
	 */
	search(k, t, compare=((a,b)=>a-b)) {
		ae() && assert(this.key);
		let u = t;
		while (u != 0 && compare(k,this.key(u)) != 0) {
			this.steps++;
			if (compare(k,this.key(u)) < 0)
				u = this.left(u);
			else
				u = this.right(u);
		}
		return u;
	}
		
	/** Append one tree after another
	 *  @param t1 is the root of tree
	 *  @param t2 is the root of a second tree
	 *  @return subtree formed by combining the two with the nodes
	 *  in t2's subtree to the right of the nodes in u's subtree
	 */
	append(t1,t2) {
		if (t1 == 0 || t1 == t2) return t2;
		else if (t2 == 0) return t1;
		let u = this.last(t1);
		[t1] = this.split(u);
		return this.join(t1,u,t2);
	}

	/** Perform a rotation in a tree.
	 *  @param x is a node in some tree; this method
	 *  moves x up into its parent's position, while maintaining the
	 *  left-to-right order of the tree nodes
	 */
	rotate(x) {
		this.steps++; this.rotations++;
		let p = this.parent_; let left = this.left_; let right = this.right_;
		let y = p[x]; if (!y) return;
		p[x] = p[y];
		     if (y == left[p[y]])  left[p[x]] = x;
		else if (y == right[p[y]]) right[p[x]] = x;
		if (x == left[y]) {
			left[y] = right[x];
			if (left[y]) p[left[y]] = y;
			right[x] = y;
		} else {
			right[y] = left[x];
			if (right[y]) p[right[y]] = y;
			left[x] = y;
		}
		p[y] = x;
	}

	/** Perform a double-rotation on a tree.
	 *  @param x is a node in the tree; the operation moves x into
	 *  its grandparent's position. Note that this is not the same
	 *  as simply doing two successive rotations at x.
	 */
	rotate2(x) {
		if (this.outerGrandchild(x))  {
			this.rotate(this.parent(x)); this.rotate(x); 
	    } else if (this.innerGrandchild(x)) {
			this.rotate(x); this.rotate(x); 
		}
	}

	/** Determine if another BinaryForest object is equal to this one.
	 *  @param that is a BinaryForest object or a string representation of one.
	 *  @return true if the two objects match; if keys are defined, the tree
	 *  structure is ignored and the two objects are considered equal if they
	 *  represent the same lists and have matching key values
	 */
	equals(that, ...args) {
		if (this.key) return this.listEquals(that, ...args);

		that = super.equals(that, ...(args.length ? args :
										[this.n, this.property(0)])); 
		if (typeof that == 'boolean') return that;

		for (let u = 1; u <= this.n; u++) {
			if (this.left(u) != that.left(u) || this.right(u) != that.right(u))
				return false;
			// p is assumed to be consistent with left and right
		}
		return that;
	}

	/** Determine if two BinaryForest objects represent the same sets.
	 *  @param that is a BinaryForest object to be compared to this
	 *  @return true if both represent the same sets.
	 */
	setEquals(that,...args) {
		that = super.equals(that, ...(args.length ? args :
										[this.n, this.property(0)])); 
		if (typeof that == 'boolean') return that;

		let l = new List(this.n);
		for (let u = 1; u <= this.n; u++) {
			if (this.parent(u)) continue;
			l.clear();
			for (let v = this.first(u); v; v = this.next(v)) l.enq(v);
			let len = 0;
			for (let v = that.first(that.root(u)); v; v = that.next(v)) {
				if (!l.contains(v)) return false;
				len++;
			}
			if (len != l.length) return false;
		}
		return that;
	}

	/** Determine if two BinaryForest objects consist of
	 *  trees with nodes in the same left-to-right order (list equality).
	 *  @param that is a BinaryForest object to be compared to this
	 *  @return true or false if the equality status can be determined
	 *  without any further comparison of objects; otherwise return an
	 *  object that can be compared to this; two objects are considered
	 *  listEqual if their trees contain the same nodes and they appear
	 *  in the same order.
	 */
	listEquals(that, ...args) {
		that = super.equals(that, ...(args.length ? args :
										[this.n, this.property(0)])); 
		if (typeof that == 'boolean') return that;

		for (let u = 1; u <= this.n; u++) {
			if (this.parent(u)) continue;
			let r1 = u; let r2 = that.root(u);
			let v1 = this.first(r1); let v2 = that.first(r2);
			while (v1 == v2 && v1 != 0) {
				v1 = this.next(v1,r1); v2 = that.next(v2,r2);
			}
			if (v1 != v2) return false;
		}
		return that;
	}

	/** Create a ListSet that defines the same lists as those defined
	 *  by the trees of this object.
	 *  @return the computed ListSet.
	 */
	toListSet() {
		let ls = new ListSet(this.n);
		for (let t = 1; t <= this.n; t++) {
			if (this.parent(t)) continue;
			let f = this.first(t);
			for (let u = this.next(f); u; u = this.next(u))
				ls.join(f,u);
		}
		let [pname,pdefault] = this.property(0);
		if (pname) {
			ls.addProperty(this.property(0));
			for (let u = 1; u <= this.n; u++)
				ls[pname](u, this[pname](u));
		}
		return ls;
	}
	
	/** Produce a string representation of the forest.
	 *  @param fmt is an integer with low-order bits specifying one
	 *  or more format options.
	 *    0b001 specifies newlines between trees
	 *    0b010 specifies that singletons are shown
	 *    0b100 specifies that the tree structure is shown
	 *  the default value is 0b100
	 *  @param label(u) is a function that is used to label nodes
	 *  @param treeProp(t) is an optional function used to label a tree.
	 */
	toString(fmt, label, treeProp=0) {
		if (!treeProp)
			treeProp = (t=> (this.treeProperty(t) ? this.treeProperty(t) : ''));

		if (!(fmt&4)) {
			return this.toListSet().toString(
						fmt&3, label, v => treeProp(this.root(v)));
		}
		let s = '';
		for (let t = 1; t <= this.n; t++) {
			if (this.parent(t) > 0) continue;
			if (this.singleton(t) && !(fmt&0x2)) continue;
			if (!(fmt&0x1) && s) s += ' ';
			if (!this.singleton(t) || treeProp(t)) s += '[';
			s += this.tree2string(t,label);
			if (!this.singleton(t) || treeProp(t)) s += ']' + treeProp(t);
			if (fmt&0x1) s += '\n';
		}
		return fmt&0x1 ? '{\n' + s + '}\n' : '{' + s + '}';
	}

	/** Recursive helper for constructing a string representation of a tree.
	 *  @param u is a node in one of the trees in the forest
	 *  @return the string
	 */
	tree2string(u, label, treeRoot=1) {
		if (u == 0) return '-'; 
		if (this.left(u) == 0 && this.right(u) == 0)
			return this.x2s(u,label);

		let s = this.tree2string(this.left(u),label,0) + ' ' +
				(treeRoot ? '*' : '') + this.x2s(u,label) + ' ' +
				this.tree2string(this.right(u),label,0);

		return (treeRoot ? s : '(' + s + ')');
	}

	/** Initialize this BinaryForest object from a string,
	 *  like those produced by toString().
	 *  @param s is a string representing a forest.
	 *  @param prop is an optional function used to parse and
	 *  process node properties; it is called with two arguments,
	 *  a node index and a Scanner
	 *  @param treeProp is an optional function used to parse and
	 *  process tree properties; it is called with two arguments,
	 *  a tree root and a Scanner
	 *  @return a BinaryForest object on success, null on failure
	 */
	static fromString(s, n=8, property=[], scan4prop=0, treeProp=0) {
		if (property[0] == 'key') {
			let ls = ListSet.fromString(s,n,0,property, scan4prop,0,treeProp);
			if (!ls) return null;
			// if keys are defined, input is assumed to be a set of lists
			// identifying the nodes in trees with their key values
			if (ls.key) {
				let bf = new BinaryForest(ls.n,property);
				for (let l = 1; l <= ls.n; l++) bf.key(l,ls.key(l));
				for (let l = 1; l <= ls.n; l++) {
					if (!ls.isfirst(l)) continue;
					let t = l;
					for (let u = ls.next(t); u; u = ls.next(u))
						t = bf.insertByKey(u,t);
				}
				return bf;
			}
		}

		// in the absence of keys, treat input as specifying trees,
		// possibly with property values; if a valid property argument is
		// supplied, it is used; if an empty property [] is provided,
		// but property values appear in the input, the property ['key',0]
		// is added, but is not used to construct trees
		let sc = new Scanner(s);
        if (!sc.verify('{')) return null;

		let propVals = []; let hasProps = 0;
		if (!scan4prop) {
			scan4prop = (u,sc) => {
							if (!sc.verify(':',0)) return true;
							let p = sc.nextNumber();
							if (Number.isNaN(p)) return false;
							propVals[u] = p; hasProps = 1;
							return true;
						}
		}
		
		let pmap = [];
	 		// pmap is an array of pairs [u,p,side] representing a mapping
	 		// from a node u to its parent, with side specifying that u is
			// the left child (-1) or right child (+1)
	
		while (!sc.verify('}')) {
			let root = BinaryForest.nextSubtree(sc, pmap, scan4prop);
			if (root < 0) return null;
			if (treeProp && !treeProp(root,sc)) return null;
		}

		// check for repeated nodes
		let nodes = new Set();
		for (let [u,p] of pmap) {
			n = Math.max(n,u,p);
			if (nodes.has(u)) return null;
			nodes.add(u);
		}
		for (let [,p] of pmap) {
			if (p < 0 || p > n) return null;
		}

		if (!property[0] && hasProps)
			property = ['key',0];
		let bf = new BinaryForest(n,property);

		// define property values
		let pname = property[0];
		for (let u = 1; u <= bf.n; u++) {
			if (propVals[u] != undefined)
				bf[pname](u,propVals[u]);
		}

		// construct trees
		for (let [u,p,side] of pmap) {
			if (p > 0) bf.link(u,p,side);
		}

		return bf;
	}

	/** Scan for tree or subtree.
	 *  @param sc is a scanner
	 *  @param pmap is an array of pairs [u,p,side] representing a mapping
	 *  from a node u to its parent, with side specifying that u is the left
	 *  child (-1) or right child (+1); if u is a tree root, p may be either
	 *  0 or negative, in which case its inverse is the tree's property;
	 *  nextSubtree adds new mappings to pmap
	 *  @param scan4prop is an optional function used to scan for an item
	 *  property
	 *  @param root is 1 if the tree being scanned is at the top level, else 0
	 *  @return the root of the subtree scanned (possibly 0 for empty subtree)
	 *  or -1 if no valid subtree
	 */
	static nextSubtree(sc, pmap, scan4prop=0, root=1) {
		if (!root && sc.verify('(') || root && sc.verify('[')) {
			let t1 = BinaryForest.nextSubtree(sc, pmap, scan4prop, 0);
			if (t1 < 0) return -1;
			let u = sc.nextIndex(scan4prop);
			if (u < 0) return -1;
			let t2 = BinaryForest.nextSubtree(sc, pmap, scan4prop, 0);
			if (t2 < 0) return -1;
			if (t1 && u) pmap.push([t1,u,-1]);
			if (t2 && u) pmap.push([t2,u,+1]);
			return ((!root && sc.verify(')') || root && sc.verify(']')) ? u:-1);
		}
		let u = sc.nextIndex(scan4prop);
		return (u >= 0 ? u : -1);
	}

	/** Initialize this object from a string that represents a set of lists.
	 *  @param s is a string representing a heap.
	 *  @param scan4prop is an optional function used to parse a list item
	 *  property
	 *  @param scan4lprop is an optional function used to parse a list property;
	 *  it is called after the closing bracket of a list and its arguments
	 *  are the first item in a list and a Scanner object
	 *  @return on if success, else false
	 */
	static fromListSetString(s, n=10, scan4prop=0, scan4lprop=0) {
		let ls = ListSet.fromString(s, n,0,[], scan4prop,0,scan4lprop);
		if (!ls) return null;
		let bf = new BinaryForest(ls.n);
		for (let l = 1; l <= ls.n; l++) {
			if (!ls.isfirst(l)) continue;
			let t = l;
			for (let u = ls.next(t); u; u = ls.next(u)) {
				t = bf.insertAfter(u,ls.prev(u),t);
			}
		}
		return bf;
	}

	/** Verify that object is self-consistent.
	 *  @return an error string if an inconsistency is found, else the
	 *  the empty string.
	 */
	verify() {
		if (this.left(0) || this.right(0) || this.parent(0))
			return `null node has non-null neighbor ${this.x2s(this.left(0))} `
				   + `${this.x2s(this.right(0))} ${this.x2s(this.parent(0))}`;
		for (let u = 1; u <= this.n; u++) {
			let pu = this.parent(u);
			if (pu) {
				if (u != this.left(pu) && u != this.right(pu))
					return `${this.x2s(u)} not a child of its parent ` +
						   `${this.x2s(pu)}`;
				let i = 0;
				for (let v = u; v; v = this.parent(v)) {
					if (i++ > this.n)
						return `infinite parent loop from ${this.x2s(u)} ` +
					   		   `with ${this.x2s(v)}`;
				}
			}
			if (this.left(u) && this.parent(this.left(u)) != u)
				return `left child ${this.x2s(this.left(u))} ` +
					   `of ${this.x2s(u)} has parent ` +
					   `${this.x2s(this.parent(this.left(u)))}`;
			if (this.right(u) && this.parent(this.right(u)) != u)
				return `right child ${this.x2s(this.right(u))} ` +
					   `of ${this.x2s(u)} has parent ` +
					   `${this.x2s(this.parent(this.right(u)))}`;
		}
		return '';
	}

	/** Return statistics object. */
	getStats() {
		return { 'steps': this.steps, 'rotations': this.rotations };
	}
}
