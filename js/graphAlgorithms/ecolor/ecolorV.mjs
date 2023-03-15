/** @file ecolorV.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import List from '../../dataStructures/basic/List.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

/** Compute a coloring of a bipartite graph using the augmenting
 *  path algorithm from the proof of Vizing's theorem.
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

	let paths = 0; let steps = 0; let psteps = 0;

	// avail[u] is a sorted list of available colors at u
	// emap[u][c] is the edge that is colored c at u
	let avail = new Array(); avail.push(null);
	let emap = new Array(); emap.push(null);
	for (let u = 1; u <= g.n; u++) {
		steps;
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
		let u = g.left(e); let v = g.right(e); steps++;
		let cu = 0; let cv = 0;
		for (cu = avail[u].first(); cu != 0; cu = avail[u].next(cu)) {
			steps++;
			if (avail[v].contains(cu)) { cv = cu; break; }
		}
		if (cu != 0) {
			// cu == cv
			g.weight(e,cu);
			if (trace) ts += g.edge2string(e) + '\n';
			avail[u].delete(cu); avail[v].delete(cu);
			emap[u][cu] = e; emap[v][cu] = e;
			continue;
		}
		// follow alternating (cu,cv) path and flip its colors
		// depends on graph being bipartite
		paths++;
		cu = avail[u].first(); cv = avail[v].first();
		let w = v; let c = cu; let f = e;
		while (emap[w][c] != 0) {
			// f is next edge on path to be colored
			// w is the "leading endpoint of f"
			// c is the color to use for f
			steps++; psteps++;
			let ff = emap[w][c];	// next edge in the path
			g.weight(f,c);
			if (trace) ts += (w == v ? '' : ' ') + g.edge2string(f);
			emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
			c = (c == cu ? cv : cu);
			w = g.mate(w,ff);
			f = ff;
		}
		// color the last edge and update the avail sets at endpoints
		g.weight(f,c);
		if (trace) ts += ' ' + g.edge2string(f) + '\n';
		emap[g.left(f)][c] = f; emap[g.right(f)][c] = f;
		avail[u].delete(cu); avail[v].delete(cv);

		// update available colors at last vertex on path
		avail[w].delete(c);
		c = (c == cu ? cv : cu);
		emap[w][c] = 0;
		avail[w].push(c);
	}
	if (trace) ts += g.toString(1);
	return [ts, { 'paths': paths, 'avg path length': ~~(psteps/paths),
				  'steps': steps }];
}
