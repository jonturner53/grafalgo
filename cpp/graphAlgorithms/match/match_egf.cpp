/** @file match_egf.cpp
 * 
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "match_egf.h"

namespace grafalgo {

/** Find a maximum size matching in a graph.
 *  @param g1 is a graph
 *  @param match is a reference to a list in which the matching is returned.
 */
match_egf::match_egf(Graph& g1, List_g<edge>& match) : match_egc(g1) {
	vertex u, v; edge e;

	// auxiliary data structures for reducing initialization overhead
	// in findpath
	searchNum = 0;
	latestSearch = new int[g->n()+1]; // equals search number if reached
	nextEdge = new edge[g->n()+1];    // next edge to search at u
	pending = new List(g->n());     // used by findpath
	unmatched = new List_d(g->n());  // list of unmatched vertices

	// Create initial maximal (not maximum) matching
	for (u = 1; u <= g->n(); u++) {
		mEdge[u] = 0; mark[u] = false; latestSearch[u] = 0;
		nextEdge[u] = g->firstAt(u);
		unmatched->addLast(u);
	}
	for (u = 1; u <= g->n(); u++) {
		if (mEdge[u] != 0) continue;
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (mEdge[v] == 0) {
				mEdge[u] = mEdge[v] = e;
				unmatched->remove(u);
				unmatched->remove(v);
				break;
			}
		}
	}
		
	while((e = findpath()) != 0) { augment(e); } 

	match.clear();
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < g->mate(u,e)) match.addLast(e);
	}
	delete [] latestSearch; delete [] nextEdge;
	delete pending; delete unmatched;
}

/** Search for an augmenting path in the graph.
 *  @return the "last" edge on the augmenting path (or 0 if none is found);
 *  on success, the returned edge identifies a list of edges in the 
 *  augpath data structure that forms the augmenting path
 */
edge match_egf::findpath() {
	pending->clear();
	vertex nextUnmatched = unmatched->first();

	searchNum++;
	while (true) {
		if (nextUnmatched != 0) {
			// initialize the next unmatched vertex and add
			// it to pending
			// doing it this way to reduce initialization overhead
			// when search ends fast
			pending->addLast(nextUnmatched);
			state[nextUnmatched] = even;
			pEdge[nextUnmatched] = 0;
			origin[nextUnmatched] = nextUnmatched;
			blossoms->clear(nextUnmatched);
			latestSearch[nextUnmatched] = searchNum;
			nextEdge[nextUnmatched] = g->firstAt(nextUnmatched);
			nextUnmatched = unmatched->next(nextUnmatched);
		}
		if (pending->empty()) break;
			
		vertex u = pending->first(); edge e = nextEdge[u];
		if (e == 0) {
			pending->removeFirst(); continue;
		} else {
			nextEdge[u] = g->nextAt(u,e);
		}
		vertex v = g->mate(u,e);
		if (latestSearch[v] != searchNum && mEdge[v] != 0) {
			// v not yet reached in this search, so can't be
			// part of any blossom yet
			// extend the tree
			vertex w = g->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			origin[v] = v; origin[w] = w;
			latestSearch[v] = latestSearch[w] = searchNum;
			blossoms->clear(v); blossoms->clear(w);
			pending->addLast(w);
			nextEdge[w] = g->firstAt(w);
			continue;
		}
		if (latestSearch[v] != searchNum) {
			// v is a tree root that hasn't been initialized yet
			// so, initialize and add to pending
			pending->addLast(v);
			state[v] = even;
			pEdge[v] = 0;
			origin[v] = v;
			blossoms->clear(v);
			latestSearch[v] = searchNum;
			nextEdge[v] = g->firstAt(v);
		}
		vertex up = base(u); vertex vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
		if (state[vp] == odd) continue;
		// vp is even
		vertex a = nca(up,vp);
		if (a == 0) {
			// up, vp are different trees - construct path & return
			vertex ru = root(up); vertex rv = root(vp);
			unmatched->remove(ru); unmatched->remove(rv);
                        edge ee = augpath->join(augpath->reverse(path(u,ru)),e);
                        return augpath->join(ee,path(v,rv));
		}
		// vp and wp are in same tree - collapse blossom
		vertex x = up;
                while (x != a) {
                        origin[blossoms->link(blossoms->find(x),
                                              blossoms->find(a))] = a;
                        x = g->mate(x,pEdge[x]); // x now odd
                        origin[blossoms->link(x,blossoms->find(a))] = a;
                        bridge[x].e = e; bridge[x].v = u;
                        if (!pending->member(x)) pending->addLast(x);
                        x = base(g->mate(x,pEdge[x]));
                }
                x = vp;
                while (x != a) {
                        origin[blossoms->link(blossoms->find(x),
                                              blossoms->find(a))] = a;
                        x = g->mate(x,pEdge[x]); // x now odd
                        origin[blossoms->link(x,blossoms->find(a))] = a;
                        bridge[x].e = e; bridge[x].v = v;
                        if (!pending->member(x)) pending->addLast(x);
                        x = base(g->mate(x,pEdge[x]));
                }
	}
	return 0;
}

} // ends namespace
