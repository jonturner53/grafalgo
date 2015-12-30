/** @file pmatch_egt.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "pmatch_egt.h"

namespace grafalgo {

/** Find a maximum size matching.
 *  @param g1 is an undirected graph
 *  @param priority[i] is priority assigned to vertex i
 *  @param match is a list in which the matching is returned
 */
pmatch_egt::pmatch_egt(Graph& g1, int* priority, List_g<edge>& match)
		: match_egc(g1), prty(priority) {

	// identify priority values actually used
	bool p[g->n()+1]; // p[i]==true means some vertex has priority i
	for (int i = 1; i <= g->n(); i++) p[i] = false;
	for (vertex u = 1; u <= g->n(); u++) p[priority[u]] = true;
	
	// Create initial maximal (not maximum) priority matching
	for (vertex u = 1; u <= g->n(); u++) {
		mEdge[u] = 0; mark[u] = false;
	}
	// could speed this up
	for (int i = 1; i <= g->n(); i++) {
		if (!p[i]) continue;
		for (vertex u = 1; u <= g->n(); u++) {
			if (prty[u] != i || mEdge[u] != 0) continue;
			for (edge e = g->firstAt(u); e!=0; e = g->nextAt(u,e)) {
				vertex v = g->mate(u,e);
				if (mEdge[v] == 0) {
					mEdge[u] = mEdge[v] = e; break;
				}
			}
		}
	}

	int i = 1; // now, build max priority matching	
	while(i <= g->n()) {
		if (!p[i]) { i++; continue; }
		edge e;
		if ((e = findpath(i)) != 0) augment(e);
		else i++;
	}


	// return matching in match list
	match.clear(); 
	for (vertex u = 1; u <= g->n(); u++) {
		if (mEdge[u] != 0 && u < g->mate(u,mEdge[u])) {
			match.addLast(mEdge[u]); 
		}
	}
}

/** Augment the matching.
 *  Replaces version in base class, as we need to unmatch the last vertex
 *  in the case of even-length path.
 *  @param e is the "last" edge in the augmenting path;
 *  the first edge is assumed to be unmatched
 */
void pmatch_egt::augment(edge e) {
	mEdge[g->left(e)] = mEdge[g->right(e)] = 0;
	while (true) {
		edge e1 = augpath->first(e);
		mEdge[g->left(e1)] = mEdge[g->right(e1)] = e1;
		if (e == augpath->first(e)) return;
		e = augpath->pop(e);
		if (e == augpath->first(e)) return;
		e = augpath->pop(e);
	}
}

/** Search for an i-augmenting path.
 *  @param i is an integer corresponding to the current priority class
 *  @return an unmatched edge on the i-augmenting path or 0 if
 *  no i-augmenting path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the augmenting path.
 */
edge pmatch_egt::findpath(int i) {
	blossoms->clear();
	List q(g->M()); // list of edges to be processed in main loop
	for (vertex u = 1; u <= g->n(); u++) {
		pEdge[u] = 0; origin[u] = u; state[u] = unreached;
		if (prty[u] == i && mEdge[u] == 0) {
			state[u] = even;
			for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e))
				if (!q.member(e)) q.addLast(e);
		}
	}

	while (!q.empty()) {
		edge e = q.first(); 
		q.removeFirst();
		vertex u = g->left(e); vertex up = base(u);
		if (state[up] != even) { u = g->right(e); up = base(u); }
		vertex v = g->mate(u,e); vertex vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
		if (state[vp] == odd) continue;
		if (state[vp] == unreached && mEdge[v] != 0) {
			// v is not contained in a tree and is matched
			// so extend tree, check for augmenting path
			// and if none, add newly eligible edges to q
			vertex w = g->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			if (prty[w] > i) { // found augmenting path 
				edge ee = augpath->reverse(path(w,root(up)));
				return ee;
			}
			for (edge ee = g->firstAt(w); ee != 0;
			     	  ee = g->nextAt(w,ee)) {
				if ((ee != mEdge[w]) && !q.member(ee))
					q.addLast(ee);
			}
			continue;
		}
		if (state[vp] == unreached) {
			return augpath->join(
					augpath->reverse(path(u,root(up))),e);
			continue;
		}
		// up and vp are both even
		vertex a = nca(up,vp);
		if (a == 0) {
			// up, vp in different trees - construct path & return
			edge ee = augpath->join(augpath->reverse(
						path(u,root(up))),e);
			ee = augpath->join(ee,path(v,root(vp)));
			return ee;
		}
		// up and vp are in same tree
		// first, check for augmenting path
		vertex x = up;
		while (x != a) {
			x = g->mate(x,pEdge[x]); // x now odd
			bridge[x].e = e; bridge[x].v = u;
			if (prty[x] > i)
				return augpath->reverse(path(x,root(up)));
			x = base(g->mate(x,pEdge[x]));
		}
		x = vp;
		while (x != a) {
			x = g->mate(x,pEdge[x]); // x now odd
			bridge[x].e = e; bridge[x].v = v;
			if (prty[x] > i)
				return augpath->reverse(path(x,root(vp)));
			x = base(g->mate(x,pEdge[x]));
		}
		// collapse the blossom and add eligible edges
		x = up;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = g->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			for (edge ee = g->firstAt(x); ee != 0;
			     	  ee = g->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(g->mate(x,pEdge[x]));
		}
		x = vp;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = g->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			for (edge ee = g->firstAt(x); ee != 0;
			     	  ee = g->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(g->mate(x,pEdge[x]));
		}
	}
	return 0;
}

} // ends namespace
