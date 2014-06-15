/** @file Mflograph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Mflograph.h"

#define flo(x) floInfo[x].flo
#define cpy(x) floInfo[x].cpy
#define mflo(x) mflo[x]

namespace grafalgo {

/** Construct a Mflograph.
 *  @param numv is the number of vertices in the graph
 *  @param maxe is the max number of edges in the graph
 *  @param s1 is the source vertex
 *  @param t1 is the sink vertex
 */
Mflograph::Mflograph(int numv, int maxe, int s1, int t1) 
	: Flograph(numv, maxe, s1, t1) {
	makeSpace(numv,maxe);
}

Mflograph::~Mflograph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Mflograph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Mflograph::makeSpace(int numv, int maxe) {
	try {
		mflo = new flow[maxe+1];
	} catch (std::bad_alloc e) {
		string s = "Mflograph::makeSpace: insufficient space for "
		   	   + to_string(maxe) + " min flows";
		throw OutOfSpaceException(s);
	}
}

/** Free space used by graph. */
void Mflograph::freeSpace() { delete [] mflo; }

/** Resize a Mflograph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Mflograph::resize(int numv, int maxe) {
	freeSpace();
	Flograph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s = "Mflograph::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Mflograph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Mflograph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Mflograph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Mflograph::copyFrom(const Mflograph& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > maxEdge)
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		edge ee = join(source.tail(e),source.head(e));
		setCapacity(ee,source.cap(source.tail(e),e));
		setFlow(ee,source.f(source.tail(e),e));
		setMinFlo(ee,source.minFlo(e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Mflograph::readAdjList(istream& in) {
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
		flow capacity, flow, minflow;
		if (!Util::verify(in,'(') || !Util::readInt(in,capacity) ||
		    !Util::verify(in,',') || !Util::readInt(in,minflow) ||
		    !Util::verify(in,',') || !Util::readInt(in,flow) ||
		    !Util::verify(in,')'))
			return 0;
        	edge e = join(u,v);
		setCapacity(e,capacity); setFlow(e,flow); setMinFlo(e,minflow);
	}
	return in.good();
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Mflograph::adjList2string(vertex u) const {
	string s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	s += "[";
	if (u == snk()) s += "->";
	s += Adt::item2string(u);
	if (u == src()) s += "->";
	s += ":";
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		vertex v = head(e);
		s += " " + item2string(v) + "(" + to_string(cap(u,e)) + ","
		   + to_string(minFlo(e)) + "," + to_string(f(u,e)) + ")";
		if (++cnt >= 15 && nextAt(u,e) != 0) {
			s +=  "\n"; cnt = 0;
		}
	}
	s +=  "]\n";
	return s;
}

/** Create readable representation of an edge.
 *  @param e is an edge
 *  @return the string
 */
string Mflograph::edge2string(edge e) const {
	string s;
	vertex u = tail(e); vertex v = head(e);
        if (e == 0) {
               s += "-"; 
	} else {
		s += "(" + item2string(u);
		s += "," + item2string(v) + "," + to_string(cap(u,e))
		     + "," + to_string(minFlo(e)) + ","
		     +  to_string(f(u,e)) + ")";
        }
	return s;
}

/** Create graphviz representation of this flograph.
 *  @return the string
 */
string Mflograph::toDotString() const {
	string s = "digraph G {\n";
        s += Adt::item2string(src()) 
           + " [ style = bold, peripheries = 2, color = red];\n";
	s += Adt::item2string(snk()) 
           + " [ style = bold, peripheries = 2, color = blue];\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		s += Adt::item2string(u) + " -> ";
		s += Adt::item2string(v);
		s += " [label = \"(" + to_string(cap(u,e)) + ","
		     + to_string(minFlo(e)) + ","
		     + to_string(f(u,e)) + ")\"]; ";
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	s += "}\n\n";
	return s;
}

/** Join two vertices with an edge.
 *  @param u is a vertex
 *  @param v is a vertex
 *  @return the number of the new edge
 */
edge Mflograph::join(vertex u, vertex v) {
	assert(1 <= u && u <= n() && 1 <= v && v <= n() && m() < maxEdge);
	edge e = Flograph::join(u,v); mflo[e] = 0;
	return e;
}

} // ends namespace
