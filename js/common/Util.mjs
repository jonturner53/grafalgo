 /** @file Util.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fatal } from './Errors.mjs';
import List from './dataStructures/basic/List.mjs';
import Dheap from './dataStructures/heaps/Dheap.mjs';

/** Create range array.
 *  @param n is a positive integer
 *  @param hi >= lo is a second integer
 *  @return [0, 1,..., n]
 */
export function range(n) {
	let p = new Array(n+1);
	for (let i = 0; i <= n; i++) p[i] = i;
	return p;
}

/** Shuffle an array, based on a permutation
 *  @param a is an array of values n+1 values
 *  @param perm is an array with the same length as a that defines a
 *  permutation on 1..n in positions 1..n
 *  @return a vector b, where b[perm[i]] = a[i] for all i.
 */
export function shuffle(a, perm) {
	let b = new Array(a.length); b[0] = 0;
	for (let i = 1; i < a.length; i++) b[perm[i]] = a[i];
	return b;
}
