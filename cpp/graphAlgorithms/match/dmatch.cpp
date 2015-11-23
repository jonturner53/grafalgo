/** @file dmatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "dmatch.h"

namespace grafalgo {

/** Maintain a maximimum size matching in a bipartite graph.
 *  Constructor allocates data and computes initial maximum matching.
 *  @param g1 is an undirected bipartite graph
 *  @param k1 defines "left" subset of vertices {1,...,k1};
 *  vertices in the left subset are also the left endpoints of their edges
 *  
 *  in the "left" set are always the left endpoint of their incident edges
 */
dmatch::dmatch(Graph& g1, int k1) : Adt(g1.n()), g(&g1), k(k1) {
	// construct initial maximal matching
	siz = 0;
	mEdge = new edge[g->n()+1];
	for (vertex u = 1; u <= g->n(); u++) mEdge[u] = 0;
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e; siz++;
		}
	}

	// add unmatched vertices from left set to roots
	pEdge = new edge[g->n()+1];
	roots = new List_d(g->n());
	for (vertex u = 1; u <= k; u++) {
		if (mEdge[u] == 0) roots->addLast(u);
	}

	maxMatch();
}

dmatch::~dmatch() {
	delete roots; delete [] mEdge; delete [] pEdge;
}

void dmatch::reset() {
	// clear old matching (if any)
	siz = 0; roots->clear();
	for (vertex u = 1; u <= g->n(); u++) mEdge[u] = 0;

	// build initial matching
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e; siz++;
		}
	}

	// add unmatched vertices from left set to roots
	for (vertex u = 1; u <= k; u++) {
		if (mEdge[u] == 0) roots->addLast(u);
	}

	// find max matching
	maxMatch();
}

/** Add edge to matching.
 */
void dmatch::addEdge(edge e) {
	vertex u = g->left(e); vertex v = g->right(e);
	if (mEdge[u] != 0 || mEdge[v] != 0) return;
	mEdge[u] = mEdge[v] = e;
	roots->remove(u);
	siz++;
}

/** Remove edge from matching.
 */
void dmatch::unmatch(edge e) {
	// remove e from match and unmatch its endpoints
	vertex u,v;
	u = g->left(e); v = g->right(e);
	if (mEdge[u] != e) return;
	mEdge[u] = mEdge[v] = 0;
	roots->addLast(u);
	siz--;
}

/** Extend the matching to include a specified vertex.
 */
bool dmatch::extendMatch(vertex s) {
	// find augmenting path from s by breadth-first search
	edge pEdge[g->n()+1];
	for (vertex v = 1; v <= g->n(); v++) pEdge[v] = 0;
	List q(g->n());
	q.addLast(s); pEdge[s] = -1;
	vertex t = 0;
	while (!q.empty() && t == 0) {
		vertex u = q.first(); q.removeFirst(); // u in in-set
		for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			if (e == pEdge[u]) continue;
			vertex v = g->mate(u,e); // v in out-set
			if (pEdge[v] != 0) continue;
			pEdge[v] = e;
			edge ee = mEdge[v];
			if (ee == 0) { t = v; break; }
			vertex w = g->mate(v,ee);
			pEdge[w] = ee;
			q.addLast(w);
		}
	}
	if (t == 0) return false;

	// flip path edges
	vertex v = t;
	while (true) {
		edge pv = pEdge[v];
		vertex u = g->mate(v,pv);
		mEdge[u] = mEdge[v] = pv;
		if (u == s) break;
		edge pu = pEdge[u];
		v = g->mate(u,pu);
	}
	roots->remove(s);
	siz++;
	return true;
}

/** Complete a maximum matching.
 */
void dmatch::maxMatch() {
	vertex s = roots->first();
	while (s != 0) {
		if (extendMatch(s)) {
			s = roots->first();
		} else {
			s = roots->next(s);
		}
	}
}

bool dmatch::isConsistent() {
	for (edge e = g->first(); e != 0; e = g->next(e)) {
		vertex u = g->left(e); vertex v = g->right(e);
		if (mEdge[u] == e && mEdge[v] != e) return false;
		if (mEdge[u] != e && mEdge[v] == e) return false;
	}
	for (vertex u = 1; u <= k; u++) {
		if (mEdge[u] != 0 &&  roots->member(u)) return false;
		if (mEdge[u] == 0 && !roots->member(u)) return false;
	}
	return true;
}

string dmatch::toString() const {
	string s = "(";
	bool first = true;
	for (vertex u = 1; u <= k; u++) {
		edge e = mEdge[u];
		if (e == 0) continue;
		if (first) first = false;
		else s += " ";
		s += g->edge2string(e);
	}
	s += ")";
	return s;
}

}// ends namespace
