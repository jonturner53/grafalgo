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
 *  @param[in] g is a graph
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if us is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
match_egf::match_egf(const Graph& g, edge *matchingEdge)
		     : match_egc(g,matchingEdge) {
	// auxiliary data structures for reducing initialization overhead
	// in findpath
	searchNum = 0;
	latestSearch = new int[gp->n()+1]; // equals search number if reached
	nextEdge = new edge[gp->n()+1];    // next edge to search at u
	pending = new List(gp->n());       // used by findpath
	unmatched = new List_d(gp->n());   // list of unmatched vertices

	for (vertex u = 1; u <= gp->n(); u++) {
		latestSearch[u] = 0;
		nextEdge[u] = gp->firstAt(u);
		if (mEdge[u] == 0) unmatched->addLast(u);
	}
		
	edge e;
	while((e = findpath()) != 0) { augment(e); } 

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
			nextEdge[nextUnmatched] = gp->firstAt(nextUnmatched);
			nextUnmatched = unmatched->next(nextUnmatched);
		}
		if (pending->empty()) break;
			
		vertex u = pending->first(); edge e = nextEdge[u];
		if (e == 0) {
			pending->removeFirst(); continue;
		} else {
			nextEdge[u] = gp->nextAt(u,e);
		}
		vertex v = gp->mate(u,e);
		if (latestSearch[v] != searchNum && mEdge[v] != 0) {
			// v not yet reached in this search, so can't be
			// part of any blossom yet
			// extend the tree
			vertex w = gp->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			origin[v] = v; origin[w] = w;
			latestSearch[v] = latestSearch[w] = searchNum;
			blossoms->clear(v); blossoms->clear(w);
			pending->addLast(w);
			nextEdge[w] = gp->firstAt(w);
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
			nextEdge[v] = gp->firstAt(v);
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
                        x = gp->mate(x,pEdge[x]); // x now odd
                        origin[blossoms->link(x,blossoms->find(a))] = a;
                        bridge[x].e = e; bridge[x].v = u;
                        if (!pending->member(x)) pending->addLast(x);
                        x = base(gp->mate(x,pEdge[x]));
                }
                x = vp;
                while (x != a) {
                        origin[blossoms->link(blossoms->find(x),
                                              blossoms->find(a))] = a;
                        x = gp->mate(x,pEdge[x]); // x now odd
                        origin[blossoms->link(x,blossoms->find(a))] = a;
                        bridge[x].e = e; bridge[x].v = v;
                        if (!pending->member(x)) pending->addLast(x);
                        x = base(gp->mate(x,pEdge[x]));
                }
	}
	return 0;
}

} // ends namespace
