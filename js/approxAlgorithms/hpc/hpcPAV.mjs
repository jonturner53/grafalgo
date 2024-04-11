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
 *  @param g0 is a graph to be searched.
 *  @param selectMax is maximum number of times an edge can be selected
 *  @param s is a starting vertex in the case of a hamiltonian path, else 0
 *  @param t is defined when s != 0 and is either a specific termination
 *  vertex or 0, in which case any termination vertex is acceptable
 *  @return a triple [path, ts, stats] where path is an array of edge numbers
 *  of length n; in a successful search for a cycle, all array entries are
 *  non-zero; in a successful search for a path, all but the last are non-zero;
 *  unsuccessful searches leave additional zero entries at the end of the array
 */
export default function hpcPAV(g0, selectMax=1, s=0, t=0, trace=0) {
	assert(s >= 0 && s <= g0.n && t >= 0 && t <= g0.n);
	assert(1 <= selectMax && selectMax <= 100);
	if (s == 0) t = 0;
	
	let u0 = (s ? s : randomInteger(1,g0.n));

	let traceString = '';
	if (trace) {
		traceString += `graph: ${g0.toString(1)}\n` +
				  	   `vertices on partial paths from ${g0.x2s(u0)} ` +
					   `with next edge\n`;
	}

	let g = new Graph(g0.n,g0.edgeRange);
	g.assign(g0);
	let selectCount = new Int8Array(g.edgeRange+1);

	let u = u0; let reversals = 0;
	let path = new Int32Array(g.n); let k = 0;
	while (g.firstAt(u)) {
		//if (s && k == g.n-1) break;
		if (!s && k == g.n-1 || s && t && k == g.n-2) {
			let lastEdge = g0.findEdge(u, (s ? t : u0));
			if (lastEdge) {
				path[k++] = lastEdge; break;
			}
		}
		let e = g.firstAt(u);
		let i = randomInteger(1,g.degree(u));
		while (i > 1) { i--; e = g.nextAt(u,e); }
		let v = g.mate(u,e);
		selectCount[e]++;
		if (selectCount[e] == selectMax) g.delete(e);
		if (s && v == t || !s && v == u0) continue;

		// find position of first edge in path containing v
		let pv = 0;
		while (pv < k) {
			if (g0.left(path[pv]) == v || g0.right(path[pv]) == v)
				break;
			pv++;
		}
		if (pv == k) { // v not on path
			path[k++] = e; u = v;
		} else {
			// reverse tail end of path
			reversals++;
			if (trace) {
				traceString += '[' + g0.x2s(u0);
				let x = u0;
				for (let i = 0; i < k; i++) {
					x = g0.mate(x,path[i]);
					traceString += ' ' + g0.x2s(x);
				}
				traceString += `] ${g0.e2s(e)}\n`;
			}
			u = g0.mate(v,path[pv+1]); // new free endpoint
			path[pv+1] = e;
			for (let j = 0; j < ~~((k-(pv+1))/2); j++) {
				let ee = path[pv+2+j];
				path[pv+2+j] = path[(k-1)-j];
				path[(k-1)-j] = ee;
			}
		}
	}
	if (trace)
		traceString += `\nfinal path: ${g0.elist2string(path,0,0,1)}\n`;
	return [path, traceString, {'reversals': reversals, 'length': k}];
}

function path2string(path, u0, k, g0) {
	let s = '[' + g0.x2s(u0);
	let x = u0;
	for (let i = 0; i < k; i++) {
		x = g0.mate(x,path[i]);
		s += ' ' + g0.x2s(x);
	}
	s += `]`;
	return s;
}
