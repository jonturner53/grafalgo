/** @file SplayForest.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import Top from '../Top.mjs';
import List from '../basic/List.mjs';
import Scanner from '../basic/Scanner.mjs';
import BinaryForest from '../graphs/BinaryForest.mjs';

/** This class adds a splay operation to the BinaryForest class
 *  and uses it to implicitly balance the trees in the forest.
 */
export default class SplayForest extends BinaryForest {
	/** Constructor for BinaryForest object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range
	 */
	constructor(n=10, capacity=n) { super(n,capacity); }

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

	/** Find the id of a tree.
	 *  @param u is a node
	 *  @param nosplay is an optional flag used to prevent the
	 *  splay operation that is usually done by a find.
	 *  @return the of the tree containing u.
	 */
	find(u, nosplay=false) {
        return nosplay ? super.find(u) : this.splay(u);
    }

	search(k, t, key) {
		return this.splay(super.search(k, t, key));
	}

	/** Insert a node based on a key value.
	 *  @param u is a singleton node
	 *  @param t is the root of the tree containing u
	 *  @param key is an array mapping nodes to key values;
	 *  the trees are assumed to be ordered by the keys
	 *  @return the root of the modified tree
	 */
	insertByKey(u, t, key) {
		super.insertByKey(u, t, key); return this.splay(u);
	}

	delete(u) { let [c,pc] = super.delete(u); this.splay(pc); }

	split(u) { this.splay(u); return super.split(u); }

	equals(other) { return super.listEquals(other); }

	toString(fmt=0x0, label=0) { return super.toString(fmt, label); }

	fromString(s, prop=0) { return super.fromListString(s, prop); }
}
