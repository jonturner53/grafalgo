/** @file Wgraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wgraph.h"

namespace grafalgo {

/** Construct a Wgraph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxEdge1 is the maximum number of edges
 */
Wgraph::Wgraph(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv, maxe);
}

/** Free space used by Wgraph */
Wgraph::~Wgraph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Wgraph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wgraph::makeSpace(int numv, int maxe) {
	try {
		wt = new int[maxe+1];
	} catch (std::bad_alloc e) {
		string s = "Wgraph::makeSpace: insufficient space for "
		   + to_string(maxe) + " edge weights";
		throw OutOfSpaceException(s);
	}
}

/** Free space used by graph. */
void Wgraph::freeSpace() { delete [] wt; }

/** Resize a Wgraph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wgraph::resize(int numv, int maxe) {
	freeSpace();
	Graph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s = "Wgraph::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Wgraph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Wgraph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Wgraph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Wgraph::copyFrom(const Wgraph& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > maxEdge)
		resize(source.n(),source.m());
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
edgeWeight Wgraph::weight(Glist<edge> elist) const {
	edgeWeight sum = 0;
	for (index x = elist.first(); x != 0; x = elist.next(x))
		sum += weight(elist.value(x));
	return sum;
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wgraph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return false;
	vertex u;
	if (!Adt::readIndex(in,u)) return false;
	if (u > n()) expand(u,m());
	if (!Util::verify(in,':')) return false;
	while (in.good() && !Util::verify(in,']')) {
		vertex v; edge e;
		if (!Adt::readIndex(in,v)) return false;
		if (v > n()) expand(v,m());
		if (m() >= maxEdge) expand(n(),max(1,2*m()));
		if (!Util::verify(in,'#')) {
			if (u < v) e = join(u,v);
		} else {
			if (!Util::readInt(in,e)) return false;
			if (e >= maxEdge) expand(n(),e);
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
string Wgraph::edge2string(edge e, vertex u) const {
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
string Wgraph::adjList2string(vertex u) const {
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
string Wgraph::toDotString() const {
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
