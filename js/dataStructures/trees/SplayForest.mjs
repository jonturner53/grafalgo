/** @file SplayForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import Scanner from '../basic/Scanner.mjs';
import BinaryForest from './BinaryForest.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** This class adds a splay operation to the BinaryForest class
 *  and uses it to implicitly balance the trees in the forest.
 */
export default class SplayForest extends BinaryForest {
	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 */
	constructor(n=10) { super(n); }

	/** Splay a search tree.
	 *  @param x is a tree node; the operation performs a series of rotations,
	 *  restructuring the tree; if used systematically, yields O(log n) time
	 *  per operation, on average
	 *  @return the root of the tree following the restructuring
	 */
	splay(x) {
		for (let y = this.p(x); y; y = this.p(x)) {
			let z = this.p(y);
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

	search(k, t, key) {
		return this.splay(super.search(k, t, key));
	}

	insertAfter(u, t, v) {
		//return super.insertAfter(u, t, v, u => this.splay(u));
		super.insertAfter(u, t, v); this.splay(u);
	}

	insertByKey(u, t, key, compare=((a,b)=>a-b)) {
		return super.insertByKey(u, t, key, compare, u => this.splay(u));
	}

	delete(u,t=0) {
		return super.delete(u, t, (cu,pu) => { this.splay(pu); });
	}

	split(u) { this.splay(u); return super.split(u); }

	equals(other) { return super.listEquals(other); }

	toString(fmt=0x0, label=0, treeProp=0) {
		return super.toString(fmt, label, treeProp);
	}

	fromString(s, prop=0) { return super.fromListString(s, prop); }
}
