/** @file Graph_wd.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Graph_wd.h"

namespace grafalgo {

/** Construct a Graph_wd with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Graph_wd::Graph_wd(int numv, int maxe) : Graph_d(numv,maxe) {
	makeSpace(numv,maxe);
}

Graph_wd::~Graph_wd() { freeSpace(); }

/** Allocate and initialize dynamic storage for Graph_wd.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_wd::makeSpace(int numv, int maxe) { len = new int[maxe+1]; }

/** Free space used by graph. */
void Graph_wd::freeSpace() { delete [] len; }

/** Resize a Graph_wd object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_wd::resize(int numv, int maxe) {
	freeSpace(); Graph_d::resize(numv,maxe); makeSpace(numv,maxe); 
}

/** Expand the space available for this Graph_wd.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Graph_wd::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= M()) return;
	Graph_wd old(this->n(),this->M()); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Graph_wd::copyFrom(const Graph_wd& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > M())
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		joinWith(source.tail(e),source.head(e),e);
		setLength(e,source.length(e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph_wd::readAdjList(istream& in) {
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
			e = join(u,v);
		} else {
			if (!Util::readInt(in,e)) return false;
			if (e >= M()) expand(n(),e);
			if (joinWith(u,v,e) != e) return false;
		}
		int w;
		if (!Util::verify(in,'(') || !Util::readInt(in,w) ||
		    !Util::verify(in,')'))
			return false;
        	setLength(e,w);
	}
	return in.good();
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Graph_wd::adjList2string(vertex u) const {
	string s = "";
	if (firstOut(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::index2string(u) + ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		s +=  " " + index2string(v);
		if (shoEnum) s += "#" + to_string(e);
		s += "(" + to_string(length(e)) + ")";
		if (++cnt >= 15 && nextOut(u,e) != 0) {
			s +=  "\n"; cnt = 0;
		}
	}
	s +=  "]\n";
	return s;
}


/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @return the string
 */
string Graph_wd::edge2string(edge e) const {
        vertex u = tail(e); vertex v = head(e);
        string s = "(" + index2string(u) + "," + index2string(v) + ","
		   + to_string(length(e)) + ")";
	if (shoEnum) s += "#" + to_string(e);
        return s;
}

/** Construct a string in dot file format representation 
 *  of the Weighted Directed Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Graph_wd::toDotString() const {
	string s = "digraph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = tail(e); vertex v = head(e);
		s += Adt::index2string(u) + " -> ";
		s += Adt::index2string(v);
		s += " [label = \" " + to_string(length(e)) + " \"] ; "; 
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	s += "}\n\n";
	return s;
}

} // ends namespace
