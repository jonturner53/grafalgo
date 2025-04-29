/** @file dcsVerify.mjs
 *
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert} from '../../common/Assert.mjs';
import List from '../../dataStructures/basic/List.mjs';
import MergeSets from '../../dataStructures/basic/MergeSets.mjs';

let g;         // shared reference to graph
let blossoms;  // set per blossom
let origin;    // original vertex for each blossom
let state;     // state used in path search
let link;      // edge to parent in tree
let mark;      // mark bits used by nca

/** Verify a degree-constrained subgraph.
 *  @param g is an undirected graph
 *  @param hi is a vector of degree upper bounds
 *  @param lo is a vector of degree lower bounds
 *  @param dcs is a Graph object that defines the subgraph
 *  @return a string which is empty if dcs is a subgraph that respects
 *  the bounds, else it describes an error
 */
export default function dcsVerify(g, hi, lo, dcs) {
	if (dcs.n != g.n)
		return `subgraph vertex count does match the graph (${dcs.n},${g.n})`;

	for (let u = 1; u <= dcs.n; u++) {
		for (let e = dcs.firstAt(u); e; e = dcs.nextAt(u,e)) {
			if (!g.validEdge(e))
				return `dcs edge ${dcs.e2s(e)} is not a valid edge in graph`;
			if (dcs.left(e) != g.left(e) || dcs.right(e) != g.right(e))
				return `dcs edge ${dcs.e2s(e)} endpoints do not ` +
						`match ${g.e2s(e)}`;
		}
		let d = dcs.degree(u);
		if (lo && d < lo[u])
			return `vertex ${g.x2s(u)} has ${d} edges, ` +
					`fewer than lo[${g.x2s(u)}]=${lo[u]}\n`;
		if (d > hi[u])
			return `vertex ${g.x2s(u)} has ${d} edges, ` +
					`more than hi[${g.x2s(u)}]=${hi[u]}\n`;
	}
	return '';
}
