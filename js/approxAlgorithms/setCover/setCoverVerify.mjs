/** @file setCoverVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';

/** Verify a set cover.
 *  @param g is a bipartite Graph object representing set cover instance
 *  @param weight is an array that defines the weights of the sets
 *  @param cover is a List of the sets in a cover
 *  @return a string which is empty if the edges define a valid tour,
 *  otherwise an error string
 */
export default function setCoverVerify(g, weight, cover) {
	let m = g.inputCount(); let n = g.outputCount();

	let mark = new Int32Array(m+n+1); let covered = 0;
	for (let j = cover.first(); j; j = cover.next(j)) {
		if (!g.isInput(j))
			return `set ${j} in cover is not an input in graph`;
		for (let e = g.firstAt(j); e; e = g.nextAt(j,e)) {
			let i = g.mate(j,e);
			if (!mark[i]) covered++;
			mark[i] = 1;
		}
	}
	if (covered != n)
		return `only ${covered} set elements out of ${n} are covered`;

	return '';
}
