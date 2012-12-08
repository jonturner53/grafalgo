/** @file Wflograph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Wflograph.h"

#define flo(x) floInfo[x].flo
#define cpy(x) floInfo[x].cpy
#define cst(x) cst[x]

namespace grafalgo {

/** Construct a Wflograph.
 *  @param numv is the number of vertices in the graph
 *  @param maxe is the max number of edges in the graph
 *  @param s1 is the source vertex
 *  @param t1 is the sink vertex
 */
Wflograph::Wflograph(int numv, int maxe, int s1, int t1) 
	: Flograph(numv, maxe, s1, t1) {
	makeSpace(numv,maxe);
}

Wflograph::~Wflograph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Wflograph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wflograph::makeSpace(int numv, int maxe) {
	try {
		cst = new floCost[maxe+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "Wflograph::makeSpace: insufficient space for "
		   << maxe << " edge costs";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
}

/** Free space used by graph. */
void Wflograph::freeSpace() { delete [] cst; }

/** Resize a Wflograph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Wflograph::resize(int numv, int maxe) {
	freeSpace();
	Flograph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s; s = "Wflograph::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Wflograph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Wflograph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Wflograph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Copy into list from source. */
void Wflograph::copyFrom(const Wflograph& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		edge ee = join(source.tail(e),source.head(e));
		setCapacity(ee,source.cap(source.tail(e),e));
		setFlow(ee,source.f(source.tail(e),e));
		setCost(ee,source.cost(source.tail(e),e));
	}
        sortAdjLists();
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wflograph::readAdjList(istream& in) {
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
	if (u > n()) expand(max(u,2*n()),m());
	if (isSrc) setSrc(u);
	if (isSnk) setSnk(u);
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readItem(in,v)) return 0;
		if (v > n()) expand(max(v,2*n()),m());
		if (m() >= maxEdge) expand(n(),2*m());
		flow capacity, flow; floCost ecost;
		if (!Util::verify(in,'(') || !Util::readInt(in,capacity) ||
		    !Util::verify(in,',') || !Util::readInt(in,ecost) ||
		    !Util::verify(in,',') || !Util::readInt(in,flow) ||
		    !Util::verify(in,')'))
			return 0;
        	edge e = join(u,v);
		setCapacity(e,capacity); setFlow(e,flow); setCost(e,ecost);
	}
	return in.good();
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wflograph::adjList2string(vertex u, string& s) const {
	stringstream ss; s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	ss << "[";
	if (u == snk()) ss << "->";
	ss << Adt::item2string(u,s);
	if (u == src()) ss << "->";
	ss << ":";
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		vertex v = head(e);
		ss << " " << item2string(v,s) << "(" << cap(u,e) << ","
		   << cost(u,e) << "," << f(u,e) << ")";
		if (++cnt >= 15 && nextAt(u,e) != 0) {
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
string& Wflograph::toDotString(string& s) const {
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
		ss << " [label = \"(" << cap(u,e) << "," << cost(u,e) << ","
		   << f(u,e) << ")\"]; ";
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	ss << "}\n" << endl;
	s = ss.str();
	return s;
}


/** Join two vertices with an edge.
 *  @param u is a vertex
 *  @param v is a vertex
 *  @return the number of the new edge
 */
edge Wflograph::join(vertex u, vertex v) {
	assert(1 <= u && u <= n() && 1 <= v && v <= n() && m() < maxEdge);
	edge e = Flograph::join(u,v); cst[e] = 0;
	return e;
}

/** Shuffle the vertices and edges according to given permutations.
 *  @param vp is a permutation on 1..(# of vertices)
 *  @param ep is a permutation on 1..(# of edges)
 */
void Wflograph::shuffle(int vp[], int ep[]) {
        edge e;
	floCost *cst1 = new floCost[m()+1];

        Flograph::shuffle(vp,ep);
        for (e = 1; e <= m(); e++) cst1[ep[e]] = cst[e];
        for (e = 1; e <= m(); e++) cst[e] = cst1[e];

        delete [] cst1;
}

/** Generate random edge costs.
 *  @param lo is the low end of the range of costs
 *  @param hi is the high end of the range of costs
 *  costs are generated uniformly in [lo,hi]
 */
void Wflograph::randCost(floCost lo, floCost hi) {
	for (edge e = first(); e != 0; e = next(e))
		setCost(e,Util::randint(lo,hi));
}

} // ends namespace
