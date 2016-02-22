/** @file pmatch_egt.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "pmatch_egt.h"

namespace grafalgo {

/** Find a maximum priority matching.
 *  @param[in] g is a graph
 *  @param[in] priority[i] is priority assigned to vertex i (range [1,g1.n()])
 *  @param[in,out] matchingEdge[u] is (on return) the matching edge incident
 *  to u or 0 if u is unmatched; if matchingEdge is not all 0 initially,
 *  it is assumed to represent a valid initial matching
 */
pmatch_egt::pmatch_egt(const Graph& g, int* priority, edge *matchingEdge)
		: match_egc(g,matchingEdge), prio(priority) {

	// partition vertices by priority
	Dlists pclass(gp->n()); vertex classId[gp->n()+1];
	for (int i = 1; i <= gp->n(); i++) classId[i] = 0;
	for (vertex u = 1; u <= gp->n(); u++) {
		int i = prio[u]; classId[i] = pclass.join(classId[i],u);
	}
	// Create initial maximal (not maximum) priority matching
	for (int i = 1; i <= gp->n(); i++) {
		if (classId[i] == 0) continue;
		for (vertex u = pclass.first(classId[i]); u != 0;
			    u = pclass.next(u)) {
			if (mEdge[u] != 0) continue;
			edge beste = 0; int bestPrio = gp->n()+1;
			for (edge e=gp->firstAt(u); e!=0; e = gp->nextAt(u,e)) {
				vertex v = gp->mate(u,e);
				if (mEdge[v] == 0 && prio[v] < bestPrio) {
					beste = e; bestPrio = prio[v];
				}
			}
			if (beste != 0) {
				mEdge[u] = mEdge[gp->mate(u,beste)] = beste;
			}
		}
	}

	// now, make it maximum size
	match_eg(g,mEdge);
	int i = 1; // now, convert to max priority
	while(i <= gp->n()) {
		if (classId[i] == 0) { i++; continue; }
		edge e;
		if ((e = findpath(i)) != 0) { augment(e); }
		else i++;
	}
}

/** Advance the matching.
 *  Replaces version in base class, as we need to unmatch the last vertex
 *  in the case of even-length path.
 *  @param[in] e is the "last" edge in the advancing path;
 *  the first edge is assumed to be unmatched
 */
void pmatch_egt::augment(edge e) {
	mEdge[gp->left(e)] = mEdge[gp->right(e)] = 0;
	while (true) {
		edge e1 = augpath->first(e);
		mEdge[gp->left(e1)] = mEdge[gp->right(e1)] = e1;
		if (e == augpath->first(e)) return;
		e = augpath->pop(e);
		if (e == augpath->first(e)) return;
		e = augpath->pop(e);
	}
}

/** Search for an advancing path.
 *  @param[in] i is an integer corresponding to the current priority class
 *  @return an unmatched edge on the i-augmenting path or 0 if
 *  no advancing path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the advancing path.
 */
edge pmatch_egt::findpath(int i) {
	blossoms->clear();
	List q(gp->M()); // list of edges to be processed in main loop
	for (vertex u = 1; u <= gp->n(); u++) {
		pEdge[u] = 0; origin[u] = u; state[u] = unreached;
		if (prio[u] == i && mEdge[u] == 0) {
			state[u] = even;
			for (edge e = gp->firstAt(u); e!=0; e = gp->nextAt(u,e))
				if (!q.member(e)) q.addLast(e);
		}
	}

	while (!q.empty()) {
		edge e = q.first(); 
		q.removeFirst();
		vertex u = gp->left(e); vertex up = base(u);
		if (state[up] != even) { u = gp->right(e); up = base(u); }
		vertex v = gp->mate(u,e); vertex vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
		if (state[vp] == odd) continue;
		if (state[vp] == unreached && mEdge[v] != 0) {
			// v is not contained in a tree and is matched
			// so extend tree, check for advancing path
			// and if none, add newly eligible edges to q
			vertex w = gp->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			if (prio[w] > i) { // found advancing path 
				edge ee = augpath->reverse(path(w,root(up)));
				return ee;
			}
			for (edge ee = gp->firstAt(w); ee != 0;
			     	  ee = gp->nextAt(w,ee)) {
				if ((ee != mEdge[w]) && !q.member(ee))
					q.addLast(ee);
			}
			continue;
		}
		// up and vp are both even and in same tree
		vertex a = nca(up,vp);
		// first, check for advancing path
		vertex x = up;
		while (x != a) {
			x = gp->mate(x,pEdge[x]); // x now odd
			bridge[x].e = e; bridge[x].v = u;
			if (prio[x] > i)
				return augpath->reverse(path(x,root(up)));
			x = base(gp->mate(x,pEdge[x]));
		}
		x = vp;
		while (x != a) {
			x = gp->mate(x,pEdge[x]); // x now odd
			bridge[x].e = e; bridge[x].v = v;
			if (prio[x] > i)
				return augpath->reverse(path(x,root(vp)));
			x = base(gp->mate(x,pEdge[x]));
		}
		// collapse the blossom and add eligible edges
		x = up;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = gp->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			for (edge ee = gp->firstAt(x); ee != 0;
			     	  ee = gp->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(gp->mate(x,pEdge[x]));
		}
		x = vp;
		while (x != a) {
			origin[blossoms->link(blossoms->find(x),
					      blossoms->find(a))] = a;
			x = gp->mate(x,pEdge[x]); // x now odd
			origin[blossoms->link(x,blossoms->find(a))] = a;
			for (edge ee = gp->firstAt(x); ee != 0;
			     	  ee = gp->nextAt(x,ee)) {
				if (!q.member(ee)) q.addLast(ee);
			}
			x = base(gp->mate(x,pEdge[x]));
		}
	}
	return 0;
}

} // ends namespace
