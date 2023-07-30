/** @file ecolorR.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import List from '../../dataStructures/basic/List.mjs';
import findSplit from '../misc/findSplit.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

let g;         // shared reference to graph
let avail;     // avail[u] is a List of available colors at u
let emap;      // emap[u][c] is the edge that is colored c at u
let color;     // color[e] is collar assigned to e

let trace;
let traceString;

let recolors;  // number of recoloring operations
let rsteps;    // number of steps in recolor operations
let steps;     // total number of steps

/** Compute a coloring of a bipartite graph using the
 *  path recoloring method.
 *  @param cg is an undirected bipartite graph
 *  @param traceFlag causes a trace string to be returned when true
 *  @return a pair [ts, stats] where ts is a possibly
 *  empty trace string and stats is a statistics object;
 *  the coloring is returned as integer edge colors in g
 */
export default function ecolorR(cg, traceFlag=false) {
	g = cg; trace = traceFlag;
	color = new Int32Array(g.edgeRange+1);
	let Delta = g.maxDegree();

	traceString = '';
	recolors = rsteps = steps = 0;

	avail = new Array(); avail.push(null);
	emap = new Array(); emap.push(null);
	for (let u = 1; u <= g.n; u++) {
		avail.push(new List(Delta));
		emap.push(new Int32Array(Delta+1));
		for (let c = 1; c <= Delta; c++) {
			avail[u].enq(c); steps++;
		}
	}

	// color each edge in turn
	let ecnt = 0;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		let [u,v] = [g.left(e),g.right(e)];
		let c = avail[u].common2(avail[v]);
			// returns first color in avail[u] that's also in avail[v];
		if (c) {
			color[e] = c;
			if (trace) traceString += `${g.e2s(e,0,1)}:${c} `;
			avail[u].delete(c); avail[v].delete(c);
			emap[u][c] = emap[v][c] = e;
			if (trace && (ecnt++)%12 == 11) traceString += '\n';
			continue;
		}
		if (traceString && ecnt%12 != 0) {
			traceString += '\n'; ecnt = 0;
		}
		recolor(e);
	}

	if (trace) {
		traceString += '\n' +
					g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${color[e]}`);
	}
	return [color, traceString,
			{ 'recolors': recolors, 'avg path length': ~~(rsteps/recolors),
	 	      'steps': steps }];
}

/** Color an edge by reversing colors on an alternating color path.
 *  @param e is an edge for which no color is available at both endpoints.
 */
function recolor(e) {
	recolors++;
	let [u,v] = [g.left(e),g.right(e)];
	let cu = avail[u].first(); let cv = avail[v].first();
	let f = e; let w = v; let c = cu;
	if (trace) traceString += '[';
	while (emap[w][c] != 0) {
		// f is next edge on path to be colored
		// w is the "leading endpoint" of f
		// c is the color to use for f
		steps++; rsteps++;
		let ff = emap[w][c];	// next edge in the path
		color[f] = c; emap[g.left(f)][c] = emap[g.right(f)][c] = f;
		if (trace) traceString += `${g.e2s(f,0,1)}:${c} `;
		f = ff; w = g.mate(w,ff); c = (c == cu ? cv : cu);
	}
	// color the last edge and update the avail sets at endpoints
	color[f] = c; emap[g.left(f)][c] = emap[g.right(f)][c] = f;
	avail[u].delete(cu); avail[v].delete(cv);
	if (trace) traceString += `${g.e2s(f,0,1)}:${c}]\n`;

	// update available colors at last vertex on path
	avail[w].delete(c);
	c = (c == cu ? cv : cu);
	emap[w][c] = 0; avail[w].push(c);
}
