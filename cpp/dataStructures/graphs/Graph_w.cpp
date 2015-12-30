/** @file Graph_w.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph_w.h"

namespace grafalgo {

/** Construct a Graph_w with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Graph_w::Graph_w(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv, maxe);
}

/** Free space used by Graph_w */
Graph_w::~Graph_w() { freeSpace(); }

/** Allocate and initialize dynamic storage for Graph_w.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_w::makeSpace(int numv, int maxe) { wt = new int[maxe+1]; }

/** Free space used by graph. */
void Graph_w::freeSpace() { delete [] wt; }

/** Resize a Graph_w object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_w::resize(int numv, int maxe) {
	freeSpace(); Graph::resize(numv,maxe); makeSpace(numv,maxe); 
}

/** Expand the space available for this Graph_w.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Graph_w::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= M()) return;
	Graph_w old(this->n(),this->M()); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Graph_w::copyFrom(const Graph_w& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > M())
		resize(source.n(),source.M());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		joinWith(source.left(e),source.right(e),e);
		setWeight(e,source.weight(e));
	}
        sortAdjLists();
}

/** Determine the total weight of a list of edges
 *  @param elist is a list of edge numbers
 *  @return the sume of the edge weights for the edges in elist
 */
edgeWeight Graph_w::weight(List_g<edge> elist) const {
	edgeWeight sum = 0;
	for (index x = elist.first(); x != 0; x = elist.next(x))
		sum += weight(elist.value(x));
	return sum;
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph_w::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return false;
	vertex u;
	if (!Adt::readIndex(in,u)) return false;
	if (u > n()) expand(u,m());
	if (!Util::verify(in,':')) return false;
	while (in.good() && !Util::verify(in,']')) {
		vertex v; edge e;
		if (!Adt::readIndex(in,v)) return false;
		if (v > n()) expand(v,m());
		if (m() >= M()) expand(n(),max(1,2*m()));
		if (!Util::verify(in,'#')) {
			if (u < v) e = join(u,v);
		} else {
			if (!Util::readInt(in,e)) return false;
			if (e >= M()) expand(n(),e);
			if (u < v) {
				if (joinWith(u,v,e) != e) return false;
			} else {
				if ((u == left(e)  && v != right(e)) ||
				    (u == right(e) && v != left(e)))
					return false;
			}
		}
		int w;
		if (!Util::verify(in,'(') || !Util::readInt(in,w) ||
		    !Util::verify(in,')'))
			return false;
		if (u < v) setWeight(e,w);
	}
	return in.good();
}

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @param u is one of the endponts of e; it will appear first in the string
 *  @return the string
 */
string Graph_w::edge2string(edge e, vertex u) const {
	string s;
        vertex v = mate(u,e);
        s += "(" + index2string(u);
	s += "," + index2string(v) + "," + to_string(weight(e)) + ")";
	if (shoEnum) s += "#" + to_string(e);
        return s;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Graph_w::adjList2string(vertex u) const {
	string s;
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::index2string(u) + ":";
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		vertex v = mate(u,e);
		s +=  " " + index2string(v);
		if (shoEnum) s += "#" + to_string(e);
		s += "(" + to_string(weight(e)) + ")";
		if (++cnt >= 15 && nextAt(u,e) != 0) {
			s +=  "\n"; cnt = 0;
		}
	}
	s +=  "]\n";
	return s;
}

/** Construct a string in dot file format representation 
 * of the Weighted Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Graph_w::toDotString() const {
	string s = "graph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		s += Adt::index2string(u) + " -- ";
		s += Adt::index2string(v);
		s += " [label = \" " + to_string(weight(e)) + " \"] ; "; 
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	s += "}\n\n";
	return s;
}

} // ends namespace
