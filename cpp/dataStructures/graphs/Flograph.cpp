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

/** Read an edge from the input stream and add it to the flograph.
 *  @param in is an open input stream
 *  @return true if the operation is successful, else false
 */
/*
bool Flograph::readEdge(istream& in) {
        vertex u, v; flow capp, ff;
        if (!Util::verify(in,'(') || !Adt::readItem(in,u) ||
            !Util::verify(in,',') || !Adt::readItem(in,v) ||
            !Util::verify(in,',') || !Util::readNum(in,capp) ||
            !Util::verify(in,',') || !Util::readNum(in,ff) || 
	    !Util::verify(in,')'))
		return false;
	if (u < 1 || v < 1) return false;

	int numv = n(); int maxe = maxEdge;
	if (u > n() || v > n()) numv = max(max(u,v),2*n());
	if (m() >= maxEdge) maxe = 2*maxEdge;
	if (numv > n() || maxe > maxEdge) resize(numv,maxe);

        edge e; e = join(u,v);
	if (e == 0) return false;
	setCapacity(e,capp); addFlow(u,e,ff);

        return true;
}
*/

/** Read a flograph from an input stream and assign to this object.
 *  @param in is an open input stream
 *  @return true on success, false on failure
 */
/*
istream& operator>>(istream& in, Flograph& fg) {
	bool ok = Util::verify(in,'{');
	while (ok && !Util::verify(in,'}')) ok = fg.readEdge(in);
	if (!ok) {
		string s = "misformatted input for Flograph object";
		throw InputException(s);
	}
	fg.sortAdjLists();
	return in;
}
*/

/*
bool Flograph::read(istream& in) {
        int numv, nume;
        in >> numv >> nume;
        if (numv != n() || nume > maxEdge) resize(numv,nume);
	else clear();
        nn = numv;

	vertex src, snk;
	if (!Util::readNode(in,src,N) || !Util::readNode(in,snk,N))
		return false;
	setSrc(src); setSnk(snk);

	for (int i = 1; i <= nume; i++)
		if (!readEdge(in)) return false;
	if (m() != nume) return false;
        return true;
}
*/

/** Create readable representation of an edge.
 *  @param e is an edge
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
/*
string& Flograph::edge2string(edge e, string& s) const {
	s = "";
	vertex u = tail(e); vertex v = head(e);
        if (e == 0) {
               s += "-"; 
	} else {
		string s1;
		s += "(" + Util::node2string(u,N,s1); 
		s += "," + Util::node2string(v,N,s1); 
		s += "," + Util::num2string(cap(u,e),s1);
		s += "," + Util::num2string(f(u,e),s1) + ")";
        }
	return s;
}
*/

/** Create readable representation of this flograph.
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
/*
string& Flograph::toString(string& s) const {
	int i; vertex u; edge e;
	stringstream ss;
	ss << n() << " " << m() << " ";
	ss << Util::node2string(src(),n(),s) << " ";
	ss << Util::node2string(snk(),n(),s) << "\n";
	for (u = 1; u <= n(); u++) {
		i = 0;
		for (e = firstOut(u); e != 0; e = nextOut(u,e)) {
			ss << edge2string(e,s) << " ";
                        if ((++i)%5 == 0) ss << "\n";
                }
                if (i>0 && i%5 != 0) ss << "\n";
	}
	s = ss.str();
	return s;
}
*/

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Flograph::adjList2string(vertex u, string& s) const {
	s = "";
	if (firstOut(u) == 0) return s;
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

/** Shuffle the vertices and edges according to given permutations.
 *  @param vp is a permutation on the integers 1..(# of vertices)
 *  @param ep is a permutation on the integers 1..(# of edges)
 *  This method remaps vertex u to vp[u] and edge e to ep[e]
 */
void Flograph::shuffle(int vp[], int ep[]) {
        edge e;
	FloInfo *floInfo1 = new FloInfo[m()+1];

        Digraph::shuffle(vp,ep);
        for (e = 1; e <= m(); e++) floInfo1[ep[e]] = floInfo[e];
        for (e = 1; e <= m(); e++) floInfo[e] = floInfo1[e];
	s = vp[s]; t = vp[t];

        delete [] floInfo1;
}

/** Generate random flow graph.
 *  @param numv is the number of vertices in the generated graph
 *  @param nume is the number of edges in the generated graph
 *  @param mss is the out-degree of the source and the in-degree of the sink
 *  
 *  The generated graph has a "core" subgraph with numv-2 nodes and
 *  nume-2*mss edges and the specified span. It is generated using
 *  Digraph::rgraph. The source and sink are then added to the core.
 *  If mss>(numv-2)/4, it is first reduced to (numv-2)/4.
 */
void Flograph::rgraph(int numv, int nume, int mss) {
	mss = max(1,mss); mss = min(mss,(numv-2)/4); 
	numv = max(numv,3); nume = max(2*mss,nume);

	if (n() != numv || maxEdge < nume) resize(numv,nume); 
	else clear();
	Digraph::rgraph(numv-2,nume-2*mss);
	setSrc(numv-1); setSnk(numv);

	vertex *neighbors = new vertex[2*mss+1];
	Util::genPerm(2*mss,neighbors);
	for (int i = 1; i <= mss; i++) {
		join(src(),neighbors[i]);
	}
	Util::genPerm(2*mss,neighbors);
	for (int i = 1; i <= mss; i++) {
		join((numv-2)-neighbors[i],snk());
	}
	sortAdjLists();

	delete [] neighbors;
}

/** Generate random edge capacities.
 *  @param ec1 is the max capacity of the source/sink edges
 *  @param ec2 is the max capacity of the remaining edges
 *  edge capacities are selected uniformly with a minimum of 1
 */
void Flograph::randCapacity(flow ec1, flow ec2) {
	for (edge e = first(); e != 0; e = next(e)) {
		if (tail(e) == s || head(e) == t)
			setCapacity(e,Util::randint(1,ec1));
		else
			setCapacity(e,Util::randint(1,ec2));
	}
}

} // ends namespace
