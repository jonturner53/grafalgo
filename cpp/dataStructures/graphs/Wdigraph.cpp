/** @file Wdigraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Wdigraph.h"

namespace grafalgo {

/** Construct a Wdigraph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Wdigraph::Wdigraph(int numv, int maxe) : Digraph(numv,maxe) {
	makeSpace(numv,maxe);
}

Wdigraph::~Wdigraph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Wdigraph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wdigraph::makeSpace(int numv, int maxe) {
	try {
		len = new int[maxe+1];
	} catch (std::bad_alloc e) {
		string s = "Wdigraph::makeSpace: insufficient space for "
			   + to_string(maxe) + " edge lengths";
		throw OutOfSpaceException(s);
	}
}

/** Free space used by graph. */
void Wdigraph::freeSpace() { delete [] len; }

/** Resize a Wdigraph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wdigraph::resize(int numv, int maxe) {
	freeSpace();
	Digraph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s = "Wdigraph::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Wdigraph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Wdigraph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Wdigraph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Wdigraph::copyFrom(const Wdigraph& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > maxEdge)
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		edge ee = join(source.tail(e),source.head(e));
		setLength(ee,source.length(e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wdigraph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return 0;
	vertex u;
	if (!Adt::readIndex(in,u)) return 0;
	if (u > n()) expand(u,m());
	if (!Util::verify(in,':')) return 0;
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readIndex(in,v)) return 0;
		if (v > n()) expand(v,m());
		if (m() >= maxEdge) expand(n(),max(1,2*m()));
		int w;
		if (!Util::verify(in,'(') || !Util::readInt(in,w) ||
		    !Util::verify(in,')'))
			return 0;
        	edge e = join(u,v); setLength(e,w);
	}
	return in.good();
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Wdigraph::adjList2string(vertex u) const {
	string s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::index2string(u) + ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		s +=  " " + index2string(v) + "(" + to_string(length(e)) + ")";
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
string Wdigraph::edge2string(edge e) const {
        vertex u = tail(e); vertex v = head(e);
        string s = "(" + index2string(u) + "," + index2string(v) + ","
		   + to_string(length(e)) + ")";
        return s;
}

/** Construct a string in dot file format representation 
 *  of the Weighted Directed Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Wdigraph::toDotString() const {
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
