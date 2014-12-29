/** @file findSplit.cpp
 * 
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph.h"
#include "List.h"
#include "ListPair.h"

using namespace grafalgo;

/** Divide the vertices of a bipartite graph into two independent sets.
 *  @param graf is a bipartite graph
 *  @param split is a set pair in which the result is returned;
 *  on successful completion, the two sets in split are both independent
 *  @return true if the algorithm succeeds, false if graf is not bipartite
 */
bool findSplit(const Graph& graf, ListPair& split) {
	bool unreached[graf.n()+1]; List q(graf.n());

	split.clear();
	vertex u;
	for (u = 1; u <= graf.n(); u++) unreached[u] = true;
	u = 1;
	while (u <= graf.n()) {
		q.addLast(u); unreached[u] = false;
		while (!q.empty()) {
			vertex v = q.first(); q.removeFirst();
			for (edge e = graf.firstAt(v); e != 0;
				  e = graf.nextAt(v,e)) {
				vertex w = graf.mate(v,e);
				if (unreached[w]) {
					if (split.isOut(v)) split.swap(w);
					q.addLast(w); unreached[w] = false;
				} else if ((split.isIn(v) && split.isIn(w)) ||
					   (split.isOut(v) && split.isOut(w))) {
					return false;
				}
			}
		}
		// find next unreached vertex
		for (u++; u <= graf.n() && !unreached[u]; u++) {}
	}
	return true;
}
