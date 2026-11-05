/** @file SplayForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import ListSet from '../basic/ListSet.mjs';
import Scanner from '../basic/Scanner.mjs';
import BinaryForest from './BinaryForest.mjs';

import { assert, assertEnabled as ae} from '../../common/Assert.mjs';

/** This class adds a splay operation to the BinaryForest class
 *  and uses it to implicitly balance the trees in the forest.
 *  Since tree structure is changed to improve efficiency, from
 *  user perspective, the data structure maintains a collection of lists.
 */
export default class SplayForest extends BinaryForest {
	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 */
	constructor(n=10,property=[]) { super(n,property); }

	/** Splay a search tree.
	 *  @param x is a tree node; the operation performs a series of rotations,
	 *  restructuring the tree; if used systematically, yields O(log n) time
	 *  per operation, on average
	 *  @return the root of the tree following the restructuring
	 */
	splay(x) {
		for (let y = this.parent(x); y; y = this.parent(x)) {
			let z = this.parent(y);
			if (z) this.rotate(this.outerGrandchild(x) ? y : x)
			this.rotate(x);
		}
		return x;
	}

	/** Find the id of a tree.
	 *  @param u is a node
	 *  @param nosplay is an optional flag used to prevent the
	 *  splay operation that is usually done by a find.
	 *  @return the of the tree containing u.
	 */
	find(u, nosplay=false) {
        return nosplay ? super.root(u) : this.splay(u);
    }

	search(k, t) {
		return this.splay(super.search(k, t));
	}

	insertAfter(u, v, t) {
		super.insertAfter(u, v, t); this.splay(u);
	}

	insertByKey(u, t, compare=((a,b)=>a-b)) {
		return super.insertByKey(u, t, compare, u => this.splay(u));
	}

	delete(u,t=0) {
		return super.delete(u, t, (cu,pu) => { this.splay(pu); });
	}

	split(u) { this.splay(u); return super.split(u); }

	equals(that, ...args) {
		return super.listEquals(that, ...(args.length ? args :
										[this.n,this.property(0)]));
	}

	/** Return a string representation of this object.
	 *  @param u is a node in a tree
	 *  @param fmt is an integer; its lower bits control the format
     *    0b001 specifies newlines between trees
     *    0b010 specifies that singletons are shown
     *    0b100 specifies that the tree structure is shown
	 *  @param nodeLabel(u) is an optional function used to produce node label
	 *  @param treeLabel(t) is an optional function used to produce tree label
	 *  @return a string
	 *  
	 *  Implementation note: this method looks redundant, but the default
	 *  format argument of 0 distinguishes it from the inherited version.
	 */
	toString(fmt=0, nodeLabel=0, treeLabel=0) {
		let [pname,pdefault] = this.property(0);
		if (!nodeLabel) {
			nodeLabel = (u => this.x2c(u) +
							  (pname ? ':' + Top.datum2string(this[pname](u)) : ''));
		}
		return super.toString(fmt, nodeLabel, treeLabel);
	}

	/** Initialize this from a string.
	 *  @param s is a string representing a set of lists;
	 *  since this data structure restructures the trees to maintain balance,
	 *  it's really just the lists that are significant
	 *  @return true on success
	 */
	static fromString(s, n=10, property=[], listProp=0) {
		let ls = ListSet.fromString(s, n,0,property,  0,0,listProp);
		if (!ls) return null;
		let sf = new SplayForest(ls.n,property);
		let [pname,pdefault] = property;
		if (pname && pname != 'rank') {
			for (let l = 1; l <= ls.n; l++) {
				if (pname) sf[pname](l,ls[pname](l));
			}
		}
		for (let l = 1; l <= ls.n; l++) {
			if (!ls.isfirst(l)) continue;
			let t = l;
			for (let u = ls.next(t); u; u = ls.next(u)) {
				if (sf.key) t = sf.insertByKey(u,t);
				else t = sf.insertAfter(u,ls.prev(u),t);
			}
		}
		return sf;
	}
}
