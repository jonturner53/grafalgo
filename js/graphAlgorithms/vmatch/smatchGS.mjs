/** @file smatchGS.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Matching from '../match/Matching.mjs';

/** Compute a stable matching in a bipartite graph using
 *  the Gale-Shapley algorithm.
 *  @param g is an undirected bipartite graph
 *  @param pref is an array of arrays, where pref[u][i] is the
 *  i-th edge in u's preference list (i starting from 1)
 *  @param subsets is a ListPair object that defines the bipartition
 *  on the vertices
 *  @param traceFlag causes a trace string to be returned when true
 *  @return a triple [match, ts, stats] where match is a Matching
 *  object; ts is a possibly empty trace string
 *  and stats is a statistics object
 */
export default function smatchGS(g, pref, subsets, trace=false) {
	let match = new Matching(g);

	let updates = 0;     // number of times an update occurs
	let steps = 0;       // total number of steps

	let traceString;
	if (trace) {
		traceString = '{\n';
		for (let u = 1; u <= g.n; u++) {
			traceString += `${g.x2s(u)}[`;
			for (let i = 1; i < pref[u].length; i++) {
				if (i > 1) traceString += ' ';
				let e = pref[u][i];
				traceString += g.x2s(g.mate(u,e));
			}
			traceString += ']\n';
		}
		traceString += '}\nnew edges in each pass\n';
	}

	// for each edge e={x,y} compute rank[e],
	// the position of e in y's preference list
	let rank = new Int32Array(g.edgeRange+1);
	for (let y = subsets.first(2); y; y = subsets.next(y,2)) {
		for (let i = 1; i < pref[y].length; i++)
			rank[pref[y][i]] = i;
	}
	steps += g.m;

	// next[x] is x's current position in its preference list
	let next = new Int32Array(g.n+1).fill(1);

	let progress = true;
	for (let pass = 1; progress; pass++) {
		progress = false;
		if (trace) traceString += `${pass}:`;
		for (let x = subsets.first(1); x; x = subsets.next(x,1)) {
			while (!match.at(x) && next[x] < pref[x].length) {
				let e = pref[x][next[x]]; let y = g.mate(x,e);
				if (!match.at(y)) {
					match.add(e); progress = true;
					if (trace) traceString += ` ${g.e2s(e,0,1)}`;
					updates++;
				} else if (rank[e] < rank[match.at(y)]) {
					match.drop(match.at(y)); match.add(e); progress = true;
					if (trace) traceString += ` ${g.e2s(e,0,1)}`;
					updates++;
				}
				next[x]++; steps++;
			}
		}
		if (trace) traceString += '\n';
	}
					
	if (trace) {
		traceString += `final matching: ${match.toString()}\n`;
	}

    return [match, traceString,
			{'size': match.size(), 'updates': updates, 'steps': steps}];
}
