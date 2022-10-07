/** @file SplaySets.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import SimpleKeySets from './SimpleKeySets.mjs';

/** This class implements a balanced binary search tree class.
 *  It partitions the index set into multiple search trees.
 */
export default class SplaySets extends SimpleKeySets {
	/** Constructor for SplaySets object.
	 *  @param n is index range for object
	 *  @param capacity is maximum index range (defaults to n)
	 */
	constructor(n=10, capacity=n) { super(n,capacity); }
	
	find(u) { return this.splay(u); }

	/** Find an item with a specified key */
	access(k, t) { return this.splay(super.access(k,t)); }

	/** Insert an item into a set.
	 *  @param u is an item to be inserted
	 *  @param t is the id for a set (the root of the bst)
	 *  @return the id of the set following insertion
	 */
	insert(u, t) { super.insert(u, t); this.splay(u); return u; }

	/** Delete an item from a set.
	 *  @param u is an item in a set
	 */
	delete(u) { super.delete(u, (c,pc) => this.splay(pc)); }

	split(u) { this.splay(u); return super.split(u); }
}
