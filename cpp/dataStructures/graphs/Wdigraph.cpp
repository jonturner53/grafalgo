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
		stringstream ss;
		ss << "Wdigraph::makeSpace: insufficient space for "
		   << maxe << " edge lengths";
		string s = ss.str();
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
		string s; s = "Wdigraph::resize:" + e.toString(s);
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
	if (!Adt::readItem(in,u)) return 0;
	if (u > n()) expand(u,m());
	if (!Util::verify(in,':')) return 0;
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readItem(in,v)) return 0;
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
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wdigraph::adjList2string(vertex u, string& s) const {
	stringstream ss; s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	ss << "[" << Adt::item2string(u,s) << ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		ss <<  " " << item2string(v,s) << "(" << length(e) << ")";
		if (++cnt >= 15 && nextOut(u,e) != 0) {
			ss <<  "\n"; cnt = 0;
		}
	}
	ss <<  "]\n";
	s = ss.str();
	return s;
}


/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
/*
string& Wdigraph::edge2string(edge e, string& s) const {
        s = "(";
        string s1;
        vertex u = tail(e); vertex v = head(e);
        s += Util::node2string(u,n(),s1) + ",";
        s += Util::node2string(v,n(),s1) + ",";
        s += Util::num2string(length(e),s1) + ")";
        return s;
}
*/

/** Construct a string in dot file format representation 
 * of the Weighted Directed Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @param s is a string object provided by the caller which
 *  is modified to provide a representation of the Graph.
 *  @return a reference to the string
 */
string& Wdigraph::toDotString(string& s) const {
	stringstream ss;
	ss << "digraph G { " << endl;
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = tail(e); vertex v = head(e);
		ss << Adt::item2string(u,s) << " -> ";
		ss << Adt::item2string(v,s);
		ss << " [label = \" " << length(e) << " \"] ; "; 
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	ss << "}\n" << endl;
	s = ss.str();
	return s;
}

/** Read one edge from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
/*
bool Wdigraph::readEdge(istream& in) {
        vertex u, v; int len;
        if (!Util::verify(in,'(') || !Util::readNode(in,u,n()) ||
            !Util::verify(in,',') || !Util::readNode(in,v,n()) ||
            !Util::verify(in,',') || !Util::readNum(in,len) ||
            !Util::verify(in,')')) {
                return false;
        }
        edge e = join(u,v);
	setLength(e,len);

        return true;
}
*/

/** Assign edges a random lengths in given range.
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Wdigraph::randLength(int lo, int hi) {
        for (edge e = first(); e != 0; e = next(e))
                setLength(e,Util::randint(lo,hi));
}

} // ends namespace
