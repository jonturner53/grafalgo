/** @file Graph_ff.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Graph_ff.h"

#define flo(x) floInfo[x].flo
#define cpy(x) floInfo[x].cpy
#define mflo(x) mflo[x]

namespace grafalgo {

/** Construct an Graph_ff.
 *  @param numv is the number of vertices in the graph
 *  @param maxe is the max number of edges in the graph
 *  @param s1 is the source vertex
 *  @param t1 is the sink vertex
 */
Graph_ff::Graph_ff(int numv, int maxe, int s1, int t1) 
	: Graph_f(numv, maxe, s1, t1) {
	makeSpace(numv,maxe);
}

Graph_ff::~Graph_ff() { freeSpace(); }

/** Allocate and initialize dynamic storage for Graph_ff.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_ff::makeSpace(int numv, int maxe) { mflo = new flow[maxe+1]; }

/** Free space used by graph. */
void Graph_ff::freeSpace() { delete [] mflo; }

/** Resize a Graph_ff object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_ff::resize(int numv, int maxe) {
	freeSpace(); Graph_f::resize(numv,maxe); makeSpace(numv,maxe);
}

/** Expand the space available for this Graph_ff.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Graph_ff::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= M()) return;
	Graph_ff old(this->n(),this->M()); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Graph_ff::copyFrom(const Graph_ff& source) {
	if (&source == this) return;
	if (source.n() > n() || source.M() > M())
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		joinWith(source.tail(e),source.head(e),e);
		setCapacity(e,source.cap(source.tail(e),e));
		setFlow(e,source.f(source.tail(e),e));
		setMinFlo(e,source.minFlo(e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph_ff::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return false;
	bool isSrc = false; bool isSnk = false;
	if (Util::verify(in,'-')) {
		if (!Util::verify(in,'>',true)) return false;
		isSnk = true;
	}
	vertex u;
	if (!Adt::readIndex(in,u)) return false;
	if (Util::verify(in,'-')) {
		if (!Util::verify(in,'>',true)) return false;
		isSrc = true;
	}
	if (!Util::verify(in,':')) return false;
	if (u > n()) expand(u,M());
	if (isSrc) setSrc(u);
	if (isSnk) setSnk(u);
	while (in.good() && !Util::verify(in,']')) {
		vertex v; edge e;
		if (!Adt::readIndex(in,v)) return false;
		if (v > n()) expand(v,M());
		if (m() >= M()) expand(n(),max(1,2*m()));
		if (!Util::verify(in,'#')) {
			e = join(u,v);
		} else {
			if (!Util::readInt(in,e)) return false;
			if (e >= M()) expand(n(),e);
			if (joinWith(u,v,e) != e) return false;
		}
		flow capacity, flow, minflow;

		if (!Util::verify(in,'(') || !Util::readInt(in,capacity) ||
		    !Util::verify(in,',') || !Util::readInt(in,minflow) ||
		    !Util::verify(in,',') || !Util::readInt(in,flow) ||
		    !Util::verify(in,')'))
			return false;
		setCapacity(e,capacity); setFlow(e,flow); setMinFlo(e,minflow);
	}
	return in.good();
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Graph_ff::adjList2string(vertex u) const {
	string s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	s += "[";
	if (u == snk()) s += "->";
	s += Adt::index2string(u);
	if (u == src()) s += "->";
	s += ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		s += " " + index2string(v);
		if (shoEnum) s += "#" + to_string(e);
		s += "(" + to_string(cap(u,e)) + ","
		   + to_string(minFlo(e)) + "," + to_string(f(u,e)) + ")";
		if (++cnt >= 10 && nextAt(u,e) != 0) {
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
string Graph_ff::edge2string(edge e) const {
	string s;
	vertex u = tail(e); vertex v = head(e);
        if (e == 0) {
               s += "-"; 
	} else {
		s += "(" + index2string(u);
		s += "," + index2string(v) + "," + to_string(cap(u,e))
		     + "," + to_string(minFlo(e)) + ","
		     +  to_string(f(u,e)) + ")";
		if (shoEnum) s += "#" + to_string(e);
        }
	return s;
}

/** Create graphviz representation of this flograph.
 *  @return the string
 */
string Graph_ff::toDotString() const {
	string s = "digraph G {\n";
        s += Adt::index2string(src()) 
           + " [ style = bold, peripheries = 2, color = red];\n";
	s += Adt::index2string(snk()) 
           + " [ style = bold, peripheries = 2, color = blue];\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		s += Adt::index2string(u) + " -> ";
		s += Adt::index2string(v);
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
edge Graph_ff::join(vertex u, vertex v) {
	assert(1 <= u && u <= n() && 1 <= v && v <= n() && m() < M());
	edge e = Graph_f::join(u,v); mflo[e] = 0;
	return e;
}

/** Join two vertices with a specific edge.
 *  @param u is a vertex
 *  @param v is a vertex
 *  @param e is the number of the edge to use (if available)
 *  @return the number of the new edge
 */
edge Graph_ff::joinWith(vertex u, vertex v, edge e) {
	assert(1 <= u && u <= n() && 1 <= v && v <= n() && e <= M());
	Graph_f::joinWith(u,v,e); mflo[e] = 0;
	return e;
}

} // ends namespace
