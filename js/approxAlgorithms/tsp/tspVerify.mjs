/** @file tspVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';

/** Verify a tsp tour.
 *  @param g is a Graph object
 *  @param tour is an array of edges that defines a tsp tour.
 *  @return a string which is empty if the edges define a valid tour,
 *  otherwise an error string
 */
export default function tspVerify(g, seed, [u0,tour]) {
	if (tour.length < g.n)
		return `tour length ${tour.length} smaller than graph size ${g.n}`;
	for (let i = 0; i < tour.length; i++) {
		let e = tour[i];
		if (!g.validEdge(e))
			return `edge number ${e} at tour[${i}] is not valid`;
	}
	for (let i = 0; i < tour.length-1; i++) {
		let e0 = tour[i]; let e1 = tour[i+1];
		let [u,v] = [g.left(e0),g.right(e0)];
		let [x,y] = [g.left(e1),g.right(e1)];
		if (u != x && u != y && v != x && v !=y)
			return `consecutive edges ${g.e2s(e,0,1)} and ${g.e2s(ee,0,1)} ` +
				   `do not share an endpoint`;
		u = v;
	}

	// verify that edges link up from starting vertex
	let u = u0;
	for (let i = 0; i < tour.length-1; i++) {
		let e0 = tour[i]; let e1 = tour[i+1]; let v = g.mate(u, e0);
		if (v != g.left(e1) && v != g.right(e1))
			return 'edges in tour do not define a cycle';
		u = v;
	}
	if (g.mate(u,tour[tour.length-1]) != u0)
		return 'last edge does not link back to first vertex';
	return '';
}

/** Check that tour edges form a consistent cycle.
 *  @param g is the graph
 *  @param tour is a candidate tsp tour
 *  @param u0 is one of the vertices in the the first edge of tour
 *  @return true if the edges form a complete cycle, when u0 is used as the
 *  initial edge
 */
function validCycle(g, tour, u0) {
	let u = u0;
	for (let i = 0; i < tour.length-1; i++) {
		let e0 = tour[i]; let e1 = tour[i+1]; let v = g.mate(u, e0);
		if (v != g.left(e1) && v != g.right(e1)) return false;
		u = v;
	}
	return g.mate(u,tour[tour.length-1]) == u0;
}
