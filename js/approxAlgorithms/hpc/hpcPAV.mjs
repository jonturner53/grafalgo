/** @file hpcPAV.mjs
 * 
 *  @author Jon Turner
 *  @date 2024
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea } from '../../common/Assert.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import { randomInteger } from '../../common/Random.mjs';

/** Find a Hamiltonian path or cycle using Angluin and Valiant's algorithm.
 *  @param G is a graph to be searched.
 *  @param selectMax is maximum number of times an edge can be selected
 *  @param s is a starting vertex in the case of a hamiltonian path, else 0
 *  @param t is defined when s != 0 and is either a specific termination
 *  vertex or 0, in which case any termination vertex is acceptable
 *  @return a triple [path, ts, stats] where path is an array of edge numbers
 *  of length n; in a successful search for a cycle, all array entries are
 *  non-zero; in a successful search for a path, all but the last are non-zero;
 *  if no path/cycle is found, null is returned in place of path
 */
export default function hpcPAV(G, selectMax=1, s=0, t=0, trace=0) {
	assert(s >= 0 && s <= G.n && t >= 0 && t <= G.n);
	assert(1 <= selectMax && selectMax <= 100);
	if (s == 0) t = 0;
	
	let u0 = (s ? s : randomInteger(1,G.n));

	let traceString = '';
	if (trace) {
		traceString += `graph: ${G.toString(1)}\n` +
				  	   `vertices on partial paths from ${G.x2s(u0)} ` +
					   `with selected edge\n`;
	}

	let g = new Graph(G.n,G.edgeRange); g.assign(G);
	let selectCount = new Int8Array(g.edgeRange+1);

	let u = u0; let rotations = 0;
	let path = new Int32Array(g.n); let k = 0;
	while (g.firstAt(u)) {
		//if (s && k == g.n-1) break;
		if (!s && k == g.n-1 || s && t && k == g.n-2) {
			let lastEdge = G.findEdge(u, (s ? t : u0));
			if (lastEdge) {
				path[k++] = lastEdge; break;
			}
		}
		let e = g.firstAt(u);
		let i = randomInteger(1,g.degree(u));
		while (i-- > 1) e = g.nextAt(u,e);
		let v = g.mate(u,e);
		selectCount[e]++;
		if (selectCount[e] == selectMax) g.delete(e);
		if (v == u0 || v == t) continue;

		// find position of first edge in path containing v
		let pv;
		for (pv = 0; pv < k; pv++) {
			if (G.left(path[pv]) == v || G.right(path[pv]) == v)
				break;
		}
		if (pv == k) { // v not on path
			path[k++] = e; u = v;
		} else {
			// reverse tail end of path
			rotations++;
			if (trace) {
				traceString += '[' + G.x2s(u0);
				let x = u0;
				for (let i = 0; i < k; i++) {
					x = G.mate(x,path[i]);
					traceString += ' ' + G.x2s(x);
				}
				traceString += `] ${G.e2s(e)}\n`;
			}
			u = G.mate(v,path[pv+1]); // new free endpoint
			path[pv+1] = e;
			for (let j = 0; j < ~~((k-(pv+1))/2); j++) {
				let ee = path[pv+2+j];
				path[pv+2+j] = path[(k-1)-j];
				path[(k-1)-j] = ee;
			}
		}
	}
	if (trace)
		traceString += `\nfinal ${s ? 'path' : 'cycle'}: ` +
					   `${G.elist2string(path,0,0,1)} ${k}\n`;
	return [((s && path[G.n-2] || !s && path[G.n-1]) ? path : null),
			traceString, {'rotations': rotations, 'length': k}];
}

function path2string(path, u0, k, G) {
	let s = '[' + G.x2s(u0);
	let x = u0;
	for (let i = 0; i < k; i++) {
		x = G.mate(x,path[i]);
		s += ' ' + G.x2s(x);
	}
	s += `]`;
	return s;
}
