/** @file mdmatchG.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { fassert } from '../../common/Errors.mjs';
import findSplit from '../misc/findSplit.mjs';
import bimatchHK from '../match/bimatchHK.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';

let g;			    // shared reference to input graph
let sg;				// temporary subgraph of g
let degree = null;  // vertex degrees in g
let emap;		    // temporary array of edges used by mdmatch
let medge;		    // array mapping vertices to incident matching edge
let mark;		    // temp array used to mark vertices

let traceString;

let steps;		// number of steps (inner loops)

/** Compute a matching in a bipartite graph that matches all vertices
 *  of maximum degree, using Gabow's algorithm; note, may not be max size.
 *  @param mg is an undirected bipartite graph
 *  @param trace causes a trace string to be returned when true
 *  @param subsets is a ListPair defining the vertex bipartition
 *  @return a triple [medge, ts, stats] where medge is either the provided
 *  array with additional matching edges or a new array defining the
 *  computed matching, ts is a possibly empty trace string
 *  and stats is a statistics object;
 *  the coloring is returned as integer edge weights in g
 */
export default function mdmatchG(mg, trace=false, subsets=null) {
	// initialize data structures
	g = mg;
	degree = new Int32Array(g.n+1);
	medge = new Int32Array(g.n+1);
	emap = new Int32Array(g.m+1);
	mark = new Int8Array(g.n+1);
	sg = new Graph(g.n,g.m); // note sg.edgeRange == g.m, not g.edgeRange

	if (!subsets) subsets = findSplit(g);

	traceString = '';
	if (trace) traceString += g.toString(0,1);
	steps =  0;

	let Delta = 0;
	for (let u = 1; u <= g.n; u++) {
		degree[u] = g.degree(u); Delta = Math.max(Delta, degree[u]);
	}

	// compute subgraph that includes all edges incident to max degree
	// vertices in first subset of bipartition; then get its matching
	// note: computed subgraph has no
	for (let u = subsets.first1(); u != 0; u = subsets.next1(u)) {
		if (degree[u] != Delta) continue;
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			let ee = sg.join(u,g.mate(u,e)); emap[ee] = e;
		}
	}
	let [match1,,stats1] = bimatchHK(sg,0,subsets);
	steps += stats1.steps;
	// Now construct medge1 array using g's edge numbers
	let medge1 = new Int32Array[g.n+1];
	for (let e = match1.first(); e; e = match1.next(e))
		medge1[sg.left(e)] = medge1[sg.right(e)] = emap[e];

	// repeat for second subset of bipartition
	emap.fill(0); sg.clear();
	for (let u = subsets.first2(); u != 0; u = subsets.next2(u)) {
		if (degree[u] != Delta) continue;
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			let ee = sg.join(u,g.mate(u,e)); emap[ee] = e;
		}
	}
	let [match2,,stats2] = bimatchHK(sg,0,subsets);
	steps += stats2.steps;
	// Now construct medge2 array using g's edge numbers
	let medge2 = new Int32Array[g.n+1];
	for (let e = match2.first(); e; e = match2.next(e))
		medge2[sg.left(e)] = medge2[sg.right(e)] = emap[e];

	if (trace)
		traceString +=  ` first matching: ${g.elist2string(medge1,0,0,1)}\n` +
						`second matching: ${g.elist2string(medge2,0,0,1)}\n` +
						`paths\n`;

	// So now, medge1 and medge2 represent the two matchings using in g
	// Add all edges in both matchings to the result matching.
	// Also, every other edge on alternating paths
	for (let u = 1; u <= g.n; u++) {
		steps++;
		let e1 = medge1[u]; let e2 = medge2[u];
		if (mark[u] || (e1 == 0 && e2 == 0)) continue;
		if (e1 == e2) {
			let v = g.mate(u,e1);
			medge[u] = medge[v] = e1; mark[v]++;
			continue;
		}

		// u is incident to one matching or to both using different edges
		let v = start(u, Delta, medge1, medge2);
			// returns vertex from which to traverse alternating
			// path/cycle containg u
		// now, travel the path from v, adding alternate edges to medge
		let w = v; mark[w]++;
		if (medge1[w]) {
			let e = medge1[w];
			if (trace) traceString += g.e2s(e,0,1);
			medge[w] = e; w = g.mate(w,e); medge[w] = e; e = medge2[w];
			mark[w]++;
			while (e != 0) {
				if (trace) traceString += ' ' + g.e2s(e,0,1);
				w = g.mate(w,e); e = medge1[w]; mark[w]++;
				steps++;
				if (e == 0 || w == v) break;
				if (trace) traceString += ' ' + g.e2s(e,0,1);
				//medge[w] = e; w = g.mate(w,e); medge[w] = e; e = medge2[w];
				match.add(e); w = g.mate(w,e); e = medge2[w];
				mark[w]++;
			}
		} else {
			let e = medge2[w];
			if (trace) traceString += g.e2s(e,0,1);
			medge[w] = e; w = g.mate(w,e); medge[w] = e; e = medge1[w];
			mark[w]++;
			while (e != 0) {
				if (trace) traceString += ' ' + g.e2s(e,0,1);
				w = g.mate(w,e); e = medge2[w]; mark[w]++; steps++;
				if (e == 0 || w == v) break;
				if (trace) traceString += ' ' + g.e2s(e,0,1);
				medge[w] = e; w = g.mate(w,e); medge[w] = e; e = medge1[w];
				mark[w]++;
			}
		}
		if (trace) traceString += '\n';
	}
	if (trace) 
		traceString +=  ` final matching: ${g.elist2string(medge,0,0,1)}\n`;
	return [medge, traceString, {'steps': steps}];
}

/** Find a starting vertex for an alternating path/cycle.
 *  For a cycle, any vertex will do. For an open path, select endpoint of
 *  max degree.
 */
function start(u, Delta, medge1, medge2) {
	// follow alternating path defined by medge1, medge2 from u
	let v = u; let e = medge1[v];
	while (e != 0) {
		steps++;
		v = g.mate(v,e); e = medge2[v];
		if (e == 0) break;
		v = g.mate(v,e); e = medge1[v];
		if (v == u) return u;	// found a cycle
	}
	// v is an endpoint
	if (degree[v] == Delta) return v;
	// find other endpoint and return it
	v = u; e = medge2[v];
	while (e != 0) {
		steps++;
		v = g.mate(v,e); e = medge1[v];
		if (e == 0) break;
		v = g.mate(v,e); e = medge2[v];
	}
	return v;
}
