/** @file ecolorV.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

/** Compute a coloring of a graph using the augmenting
 *  path algorithm from the proof of Vizing's theorem.
 *  If the graph is bipartite, the coloring is optimal,
 *  if not, it may use one extra color.
 *  @param g is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @return a pair [ts, stats] where ts is a possibly
 *  empty trace string and stats is a statistics object;
 *  the coloring is returned as integer edge weights in g
 */
export default function ecolorV(g, trace=false) {
	let Delta = g.maxDegree();
	let color = new Int32Array(g.edgeRange+1);
	let ts = '';
	g.addWeights();

	let paths = 0; let steps = 0;

	// avail[u] is a sorted list of available colors at u
	// emap[u][c] is the edge that is colored c at u
	let avail = new Array(); avail.push(null);
	let emap = new Array(); emap.push(null);
	for (let u = 1; u <= g.n; u++) {
		avail.push(new List(Delta));
		emap.push(new Int32Array(Delta+1));
		for (let c = 1; c <= Delta; c++) {
			avail[u].enq(c); emap[u][c] = 0;
		}
	}

	if (trace) ts += 'colors to flip and augmenting path\n'
	// color each edge in turn
	for (let e = g.first(); e != 0; e = g.next(e)) {
		// first look for a color that is available at both endpoints
		let u = g.left(e); let v = g.right(e);
		let cu = avail[u].first(); let cv = avail[v].first();
		while (cu != 0 && cv != 0 && cu != cv) {
if (avail[u].next(cu) > 0 && avail[u].next(cu) <= cu) console.log('a disorder', g.index2string(u), avail[u].toString(), cu,avail[u].next(cu));
if (avail[v].next(cv) > 0 && avail[v].next(cv) <= cv) console.log('b disorder', g.index2string(v), avail[v].toString(), cv,avail[v].next(cv));
			steps++;
			if (cu < cv) cu = avail[u].next(cu);
			else	     cv = avail[v].next(cv);
		}
		if (cu != 0 && cv != 0) {
			// cu == cv, is available at both
			g.setWeight(e,cu);
			if (trace) ts += g.edge2string(e) + '\n';
try {
			avail[u].delete(cu);
} catch(e) {
console.log(g.index2string(u),cu,avail[u].toString((c) => c));
throw(e);
}
try {
			avail[v].delete(cv);
} catch(e) {
console.log(g.index2string(v),cv,avail[v].toString((c) => c));
throw(e);
}
			emap[u][cu] = e; emap[v][cv] = e;
			continue;
		}
		// follow alternating (cu,cv) path and flip its colors
		// depends on graph being bipartite
		paths++;
		cu = avail[u].first(); cv = avail[v].first();
		//if (trace) ts += `${cu}<->${cv}: `;
		let w = v; let c = cu; let f = e;
		while (emap[w][c] != 0) {
			// f is next edge on path to be colored
			// w is the "leading endpoint of f"
			// c is the color to use for f
			steps++;
			let ff = emap[w][c];	// next edge in the path
			g.setWeight(f,c);
			if (trace) ts += (w == v ? '' : ' ') + g.edge2string(f);
			emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
			c = (c == cu ? cv : cu);
			w = g.mate(w,ff);
			f = ff;
		}
		// color the last edge and update the avail sets at endpoints
		g.setWeight(f,c);
		if (trace) ts += ' ' + g.edge2string(f) + '\n';
		emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
		avail[u].delete(cu); avail[v].delete(cv);

		// update available colors at last vertex on path
		avail[w].delete(c);
		c = (c == cu ? cv : cu);
		emap[w][c] = 0;
		let ac = avail[w].first();
		if (c < ac) avail[w].push(c);
		else {
			while (ac != 0 && c > avail[w].next(ac)) {
				steps++;
				ac = avail[w].next(ac);
			}
			if (ac == 0) avail[w].enq(c);
			else avail[w].insert(c,ac);
		}
	}
	if (trace) ts += g.toString(0,1);
	return [ts, { 'paths': paths, 'steps': steps }];
}
