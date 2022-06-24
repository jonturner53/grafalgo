/** @file match.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

/** Return a string representation of a matching.
  * @param g is a graph
  * @param match maps each vertex u to its matching edge match[u]
  */
export function match2string(g, match) {
	let s = '['; let first = true;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		if (match[g.left(e)] == e) {
			if (first) first = false;
			else s += ' ';
			s += g.edge2string(e);
		}
	}
	return s + ']';
}

/** Return the number of edges in a matching.
 *  @param g is an undirected graph
 *  @param match is a mapping from vertices to matching edges.
 */
export function matchSize(g, match) {
	let mm = 0;
	for (let u = 1; u <= g.n; u++) {
		if (match[u]) mm++;
	}
	return mm/2;
}

/** Return the weight of a matching.
 *  @param g is an weighted graph
 *  @param match is a mapping from vertices to matching edges.
 */
export function matchWeight(g, match) {
	let ww = 0;
	for (let u = 1; u <= g.n; u++) {
		if (match[u]) ww += g.weight(match[u]);
	}
	return ww/2;
}
