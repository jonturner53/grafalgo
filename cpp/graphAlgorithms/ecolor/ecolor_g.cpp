/** @file ecolor_g.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ecolor_g.h"
#include "mdmatch_f.h"
#include "mdmatch.h"

namespace grafalgo {

/** Find a minimum edge coloring in a bipartite graph using Gabow's algorithm.
 *  @param g is a reference to the graph
 *  @param color is an array indexed by an edge number; on return
 *  color[e] is the color assigned to edge e
 *  @return the number of colors used or 0 if the graph is not bipartite
 */
ecolor_g::ecolor_g(Graph& g, int color[]) {
	// initialize data structures
	gp = &g;
	cg = new Graph(g.n(),g.M());
	cg->copyFrom(g);
	this->color = color;
	match = new List_g<edge>(g.n()/2);
	euler = new Djsets_cl(g.M());
	handle = new List_g<edge>(g.M());
	start = new List_d(g.n());

	nextColor = 1;
	rColor(g.maxDegree());
}

ecolor_g::~ecolor_g() {
	delete match; delete euler; delete handle; delete start;
}

/** Recursive helper function.
 *  Colors the current graph cg, modifying it as necessary, along the way.
 *  Note: cg uses same vertex numbers and edge numbers as original graph.
 *  Also uses global data structures euler and handle, within eulerPartition
 *  method.
 *  @param Delta is the max vertex degree in the current graph cg.
 */
void ecolor_g::rColor(int Delta) {
	// if cg is a matching, just color its edges
	if (Delta == 1) {
		for (edge e = cg->first(); e != 0; e = cg->next(e))
			color[e] = nextColor;
		nextColor++;
		return;
	}

	if ((Delta&1) == 1) {
		// find matching in cg that includes every max degree vertex
		match->clear();
		mdmatch_f(*cg, *match);

		// now, color edges in matching and remove from cg
		for (index x = match->first(); x != 0; x = match->next(x)) {
			edge e = match->value(x);
			color[e] = nextColor; cg->remove(e);
		}
		nextColor++;

		Delta--; // decrement max degree
	}
	// cg now has even maximum degree
	int m = cg->m();

	// find Euler partition and return in euler and handle;
	// on completion, cg has no edges
	eulerPartition();

	// rebuild cg using half of the edges, place others in list
	List_g<edge> L(m/2); 
	while (!handle->empty()) {
		edge e = handle->value(handle->first()); handle->removeFirst();
		edge ee = e; bool odd = true;
		do {
			if (odd) cg->joinWith(gp->left(ee), gp->right(ee), ee);
			else L.addLast(ee);
			odd = not odd;
			edge tmp = ee;
			ee = euler->next(ee);
			if (tmp != e) euler->remove(tmp);
		} while (ee != e);
	}
	// note: euler and handle now ready for re-use

	// recursive calls on the two subgraphs
	rColor(Delta/2);
	cg->clear();
	for (index x = L.first(); x != 0; x = L.next(x)) {
		edge e = L.value(x);
		cg->joinWith(gp->left(e), gp->right(e), e);
	}
	rColor(Delta/2);
}

/** Find an Euler partition in the current graph.
 *  The partition is returned in the euler/handle data structures.
 *  Specifically, handle contains the "first" edge of some edge set
 *  in the partition. The edge sets are defined by circular lists in
 *  the euler data structure.
 */
void ecolor_g::eulerPartition() {
	// make list of start vertices, beginning with those of odd degree
	for (vertex u = 1; u <= cg->n(); u++) {
		if ((cg->degree(u)&1) == 1) start->addFirst(u);
		else if (cg->firstAt(u) != 0) start->addLast(u);
	}

	// traverse paths/cycles from start vertices
	// place edges in separate lists
	while (!start->empty()) {
		vertex s = start->first(); start->removeFirst();
		edge e = cg->firstAt(s);
		if (e == 0) continue;
		vertex v = s; edge ee = e;
		do {
			if (ee != e) euler->join(ee,e);
			v = cg->mate(v,ee);
			cg->remove(ee);
			ee = cg->firstAt(v);
		} while (ee != 0);
		handle->addLast(e);
		if (cg->firstAt(s) != 0) start->addLast(s);
	}
	// note: start now empty, ready for re-use
}

} // ends namespace
