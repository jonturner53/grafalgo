/** @file Flograph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Flograph.h"

#define flo(x) floInfo[x].flo
#define cpy(x) floInfo[x].cpy

namespace grafalgo {

/** Constructor for Flograph objects.
 *  @param numv is number of vertices in graph
 *  @param maxe is max possible number of edges in graph
 *  @param s1 is the vertex number of the source
 *  @param t1 is the vertex number of the sink
 */
Flograph::Flograph(int numv, int maxe, int s1, int t1) 
	: Digraph(numv, maxe), s(s1), t(t1) {
        assert(n() >= 2 && maxEdge >= 0 && 1 <= s && s <= n() 
		&& 1 <= t && t <= n() && s != t);
	makeSpace(numv,maxe);
}

Flograph::~Flograph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Flograph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Flograph::makeSpace(int numv, int maxe) {
	try {
		floInfo = new FloInfo[maxe+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "Flograph::makeSpace: insufficient space for "
		   << maxe << " edge weights";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
}

/** Free space used by graph. */
void Flograph::freeSpace() { delete [] floInfo; }

/** Resize a Flograph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Flograph::resize(int numv, int maxe) {
	freeSpace();
	Digraph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s; s = "Flograph::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Flograph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Flograph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Flograph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Flograph::copyFrom(const Flograph& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > maxEdge)
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		edge ee = join(source.tail(e),source.head(e));
		setCapacity(ee,source.cap(source.tail(e),e));
		setFlow(ee,source.f(source.tail(e),e));
	}
	setSrc(source.src()); setSnk(source.snk());
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Flograph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return 0;
	bool isSrc = false; bool isSnk = false;
	if (Util::verify(in,'-')) {
		if (!Util::verify(in,'>',true)) return 0;
		isSnk = true;
	}
	vertex u;
	if (!Adt::readItem(in,u)) return 0;
	if (Util::verify(in,'-')) {
		if (!Util::verify(in,'>',true)) return 0;
		isSrc = true;
	}
	if (!Util::verify(in,':')) return 0;
	if (u > n()) expand(u,m());
	if (isSrc) setSrc(u);
	if (isSnk) setSnk(u);
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readItem(in,v)) return 0;
		if (v > n()) expand(v,m());
		if (m() >= maxEdge) expand(n(),max(1,2*m()));
		int capacity, flow;
		if (!Util::verify(in,'(') || !Util::readInt(in,capacity) ||
		    !Util::verify(in,',') || !Util::readInt(in,flow) ||
		    !Util::verify(in,')'))
			return 0;
        	edge e = join(u,v);
		setCapacity(e,capacity); setFlow(e,flow);
	}
	return in.good();
}

/** Join two vertices with an edge.
 *  @param u is a vertex number
 *  @param v is a vertex number
 *  @return number of new edge from u to v
 */
edge Flograph::join(vertex u, vertex v) {
	assert(1 <= u && u <= n() && 1 <= v && v <= n() && m() < maxEdge);
	edge e = Digraph::join(u,v); setFlow(e,0);
	return e;
}

/** Remove flow from all edges.
 */
void Flograph::clearFlow() {
	for (edge e = first(); e != 0; e = next(e)) setFlow(e,0);
}

/** Add to the flow on an edge.
 *  @param v is a vertex
 *  @param e is an edge with v as one of its endpoints
 *  @param ff is a flow to be added to e, from v to the other endpoint
 *  @return the amount of flow on the edge leaving v, after ff has been added
 */
void Flograph::addFlow(vertex v, edge e, flow ff) {
	if (tail(e) == v) {
		if (ff + flo(e) > cpy(e) || ff + flo(e) < 0) {
			Util::fatal("addflow: requested flow outside allowed "
				    "range");
		}
		flo(e) += ff;
	} else {
		if (flo(e) - ff < 0 || flo(e) - ff > cpy(e)) {
			Util::fatal("addflow: requested flow outside allowed "
				    "range");
		}
		flo(e) -= ff;
	}
}

/** Create readable representation of an edge.
 *  @param e is an edge
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
string& Flograph::edge2string(edge e, string& s) const {
	stringstream ss;
	vertex u = tail(e); vertex v = head(e);
        if (e == 0) {
               ss << "-"; 
	} else {
		ss << "(" << item2string(u,s);
		ss << "," << item2string(v,s)
		   << "," << cap(u,e) << "," <<  f(u,e) << ")";
        }
	s = ss.str();
	return s;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Flograph::adjList2string(vertex u, string& s) const {
	s = "";
	if (firstOut(u) == 0 && u != src() && u != snk()) return s;
	stringstream ss;
	ss << "[";
	if (u == snk()) ss << "->";
	ss << Adt::item2string(u,s);
	if (u == src()) ss << "->";
	ss << ":";
	int cnt = 0;
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		ss << " " << Adt::item2string(v,s) << "(" << cap(u,e) << ","
		   << f(u,e) << ")";
		if (++cnt >= 15 && nextOut(u,e) != 0) {
			ss <<  "\n"; cnt = 0;
		}
	}
	ss <<  "]\n";
	s = ss.str();
	return s;
}

/** Create graphviz representation of this flograph.
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
string& Flograph::toDotString(string& s) const {
	stringstream ss;
	ss << "digraph G { " << endl;
        ss << Adt::item2string(src(),s) 
           << " [ style = bold, peripheries = 2, color = red]; "
           << endl;
	ss << Adt::item2string(snk(),s) 
           << " [ style = bold, peripheries = 2, color = blue]; "
           << endl;
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		ss << Adt::item2string(u,s) << " -> ";
		ss << Adt::item2string(v,s);
		ss << " [label = \"(" << cap(u,e) << "," << f(u,e) << ")\"]; ";
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	ss << "}\n" << endl;
	s = ss.str();
	return s;
}

} // ends namespace
