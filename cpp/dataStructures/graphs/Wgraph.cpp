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
		stringstream ss;
		ss << "Wgraph::makeSpace: insufficient space for "
		   << maxe << " edge weights";
		string s = ss.str();
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
		string s; s = "Wgraph::resize:" + e.toString(s);
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
	if (source.n() > n()) resize(source.n());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		edge ee = join(source.left(e),source.right(e));
		setWeight(ee,source.weight(e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wgraph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return 0;
	vertex u;
	if (!Adt::readItem(in,u)) return 0;
	if (u > n()) expand(max(u,2*n()),m());
	if (!Util::verify(in,':')) return 0;
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readItem(in,v)) return 0;
		if (v > n()) expand(max(v,2*n()),m());
		if (m() >= maxEdge) expand(n(),2*m());
		int w;
		if (!Util::verify(in,'(') || !Util::readInt(in,w) ||
		    !Util::verify(in,')'))
			return 0;
        	if (u < v) { edge e = join(u,v); setWeight(e,w); }
	}
	return in.good();
}


/** Read a graph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
/*
istream& operator>>(istream& in, Wgraph& wg) {
	wg.clear();
	bool ok = Util::verify(in,'{');
	while (ok && !Util::verify(in,'}')) ok = wg.readAdjList(in);
	if (!ok) {
		string s = "misformatted input for Wgraph object";
		throw InputException(s);
	}
	g.sortAdjLists();
	return in;
}
*/

/** Read one edge from an input stream, add it to the graph.
 *  Since for undirected graphs, edges appear on both adjacency lists,
 *  ignore an edge if its second vertex is larger than the first.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
/*
bool Wgraph::readEdge(istream& in) {
        vertex u, v; int w;
        if (!Util::verify(in,'(') || !Util::readNode(in,u,n()) ||
            !Util::verify(in,',') || !Util::readNode(in,v,n()) ||
            !Util::verify(in,',') || !Util::readNum(in,w)      ||
	    !Util::verify(in,')'))
                return false;
        if (u < 1 || u > n() || v < 1 || v > n()) return false;
	edge e;
        if (u < v) { e = join(u,v); setWeight(e,w); }

        return true;
}
*/

/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
/*
string& Wgraph::edge2string(edge e, string& s) const {
        s = "(";
        string s1;
        vertex u = left(e); vertex v = right(e);
        s += Adt::item2string(u,s1) + ",";
        s += Adt::item2string(v,s1) + ",";
	s += Util::num2string(wt[e],s1) + ")";
        return s;
}
*/

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @param u is one of the endponts of e; it will appear first in the string
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
/*
string& Wgraph::edge2string(edge e, vertex u, string& s) const {
        s = "(";
        string s1;
        vertex v = mate(u,e);
        s += Util::node2string(u,n(),s1) + ",";
        s += Util::node2string(v,n(),s1) + ",";
	s += Util::num2string(wt[e],s1) + ")";
        return s;
}
*/

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wgraph::adjList2string(vertex u, string& s) const {
	stringstream ss; s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	ss << "[" << Adt::item2string(u,s) << ":";
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		vertex v = mate(u,e);
		ss <<  " " << item2string(v,s) << "(" << weight(e) << ")";
		if (++cnt >= 15 && nextAt(u,e) != 0) {
			ss <<  "\n"; cnt = 0;
		}
	}
	ss <<  "]\n";
	s = ss.str();
	return s;
}

/** Assign edges a random weight in given range.
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Wgraph::randWeight(int lo, int hi) {
        for (edge e = first(); e != 0; e = next(e))
		setWeight(e,Util::randint(lo,hi));
}

/** Construct a string in dot file format representation 
 * of the Weighted Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @param s is a string object provided by the caller which
 *  is modified to provide a representation of the Graph.
 *  @return a reference to the string
 */
string& Wgraph::toDotString(string& s) const {
	stringstream ss;
	ss << "graph G { " << endl;
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		ss << Adt::item2string(u,s) << " -- ";
		ss << Adt::item2string(v,s);
		ss << " [label = \" " << weight(e) << " \"] ; "; 
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	ss << "}\n" << endl;
	s = ss.str();
	return s;
}

} // ends namespace
