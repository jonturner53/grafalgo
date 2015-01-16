/** @file Digraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Digraph.h"

namespace grafalgo {

/** Construct a Digraph with space for a specified number of vertices and edges.
 *  @param numv is the maximum number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Digraph::Digraph(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv,maxe); init();
}

Digraph::~Digraph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Digraph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Digraph::makeSpace(int numv, int maxe) { fi = new edge[numv+1]; } 

/** Initialize Digraph object. */
void Digraph::init() { for (vertex u = 0; u <= n(); u++) fi[u] = 0; }

/** Free space used by graph. */
void Digraph::freeSpace() { delete [] fi; }

/** Resize a Digraph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Digraph::resize(int numv, int maxe) {
	freeSpace(); Graph::resize(numv,maxe); makeSpace(numv,maxe); init();
}

/** Expand the space available for this Digraph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Digraph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= M()) return;
	Digraph old(this->n(),this->M()); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Join two vertices with a specific edge.
 *  @param u is the tail of the new edge
 *  @param v is the head of the new edge
 *  @param e is the number of an idle edge
 *  @return the edge number for the new edge, or 0 on failure
 */
edge Digraph::joinWith(vertex u, vertex v, edge e) {
	assert(validVertex(u) && validVertex(v) && edges->isOut(e));
	edges->swap(e);

	// initialize edge information
	evec[e].l = u; evec[e].r = v;

	// add edge to the adjacency lists
	// in the adjLists data structure, each endpoint appears twice,
	// as 2*e and 2*e+1
	if (fe[u] == 0) fe[u] = 2*e;
	else adjLists->join(2*e,fe[u]);
	if (fi[v] == 0) fi[v] = 2*e+1;
	else adjLists->join(2*e+1,fi[v]);

	return e;
}

/** Remove an edge from the Digraph.
 *  @param e is the edge to be removed.
 *  @return true on success, false on failure
 */
bool Digraph::remove(edge e) {
	assert(validEdge(e));
	edges->swap(e);

	vertex u = evec[e].l;
	if (fe[u] == 2*e)
		fe[u] = (adjLists->next(2*e) == 2*e ? 0 : adjLists->next(2*e));
	u = evec[e].r;
	if (fi[u] == 2*e+1)
		fi[u] = (adjLists->next(2*e+1) == 2*e+1 ?
				0 : adjLists->next(2*e+1));

	adjLists->remove(2*e); adjLists->remove(2*e+1);

	evec[e].l = 0;

	return true;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Digraph::adjList2string(vertex u) const {
	string s;
	if (firstOut(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::index2string(u) + ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		s += " " + Adt::index2string(v);
		if (shoEnum) s += "#" + to_string(e);
		if (++cnt >= 20 && nextOut(u,e) != 0) {
			s += "\n"; cnt = 0;
		}
	}
	s += "]\n";
	return s;
}

/** Construct a string in dot file format representation 
 * of the Directed Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Digraph::toDotString() const {
	string s = "digraph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = tail(e); vertex v = head(e);
		s += Adt::index2string(u) + " -> ";
		s += Adt::index2string(v) + " ; "; 
		if (++cnt == 15) { cnt = 0; s += "\n"; }
	}
	s += "}\n";
	return s;
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Digraph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return false;
	vertex u;
	if (!Adt::readIndex(in,u)) return false;
	if (u > n()) expand(u,M());
	if (!Util::verify(in,':')) return false;
	while (in.good() && !Util::verify(in,']')) {
		vertex v; edge e;
		if (!Adt::readIndex(in,v)) return false;
		if (v > n()) expand(v,M());
		if (m() >= M()) expand(n(),max(1,max(1,2*M())));
		if (!Util::verify(in,'#')) {
			e = join(u,v);
		} else {
			if (!Util::readInt(in,e)) return false;
			if (e >= M()) expand(n(),e);
			if (joinWith(u,v,e) != e) return false;
		}
	}
	return in.good();
}

} // ends namespace
