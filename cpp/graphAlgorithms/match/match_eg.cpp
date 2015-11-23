/** @file match_eg.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "match_eg.h"

namespace grafalgo {

/** Find a maximum size matching.
 *  @param g1 is an undirected graph
 *  @param match is a list in which the matching is returned
 */
match_eg::match_eg(Graph& g1, List_g<edge>& match)
		: match_egCore(g1) {
	// Create initial maximal (not maximum) matching
	for (vertex u = 1; u <= g->n(); u++) {
		mEdge[u] = 0; mark[u] = false;
	}
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e;
		}
	}
		
	edge e;
	while((e = findpath()) != 0) augment(e);

	match.clear(); 
	for (vertex u = 1; u <= g->n(); u++) {
		if (mEdge[u] != 0 && u < g->mate(u,mEdge[u])) {
			match.addLast(mEdge[u]); 
		}
	}
}

/** Search for an augmenting path.
 *  @return an unmatched edge on the augmenting path or 0 if
 *  no augmenting path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the augmenting path.
 */
edge match_eg::findpath() {
cerr << "a\n";
	blossoms->clear();
	List q(g->m()); // list of edges to be processed in main loop
	for (vertex u = 1; u <= g->n(); u++) {
		pEdge[u] = 0; origin[u] = u; state[u] = unreached;
		if (mEdge[u] == 0) {
			state[u] = even;
			for (edge e = g->firstAt(u); e != 0;
				  e = g->nextAt(u,e))
				q.addLast(e);
		}
	}

cerr << "b\n";
	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex u = g->left(e); vertex up = base(u);
		if (state[up] != even) { u = g->right(e); up = base(u); }
		vertex v = g->mate(u,e); vertex vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
cerr << g->edge2string(e) << " " << g->index2string(u) << " "
     << g->index2string(up) << " " << g->index2string(v) << " "
     << g->index2string(vp) << endl;
		if (state[vp] == unreached) {
			// v is not contained in a blossom and is matched
			// so extend tree and add newly eligible edges to q
			vertex w = g->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			for (edge ee = g->firstAt(w); ee != 0;
			     	  ee = g->nextAt(w,ee)) {
				if ((ee != mEdge[w]) && !q.member(ee))
					q.addLast(ee);
			}
			continue;
		}
		vertex a = nca(up,vp);
		if (state[vp] == even && a == 0) {
			// up, vp are different trees - construct path & return
			edge ee = augpath->join(
					augpath->reverse(path(u,root(up))),e);
			return augpath->join(ee,path(v,root(vp)));
		} else if (state[vp] == even) {
			// vp and wp are in same tree - collapse blossom
			vertex x = up;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				origin[blossoms->link(x,blossoms->find(a))] = a;
				bridge[x].e = e; bridge[x].v = v;
				for (edge ee = g->firstAt(x); ee != 0;
				     	  ee = g->nextAt(x,ee)) {
					if (!q.member(ee)) q.addLast(ee);
				}
				x = base(g->mate(x,pEdge[x]));
				origin[blossoms->link(blossoms->find(x),
						      blossoms->find(a))] = a;
			}
			x = vp;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				origin[blossoms->link(x,blossoms->find(a))] = a;
				bridge[x].e = e; bridge[x].v = v;
				for (edge ee = g->firstAt(x); ee != 0;
				     	  ee = g->nextAt(x,ee)) {
					if (!q.member(ee)) q.addLast(ee);
				}
				x = base(g->mate(x,pEdge[x]));
				origin[blossoms->link(blossoms->find(x),
						      blossoms->find(a))] = a;
			}
		} 
	}
	return 0;
}

} // ends namespace
