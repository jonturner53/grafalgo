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

/** Constructor for Flograph objects.
 *  @param numv is number of vertices in graph
 *  @param maxe is max possible number of edges in graph
 *  @param s1 is the vertex number of the source
 *  @param t1 is the vertex number of the sink
 */
Flograph::Flograph(int numv, int maxe, int s1, int t1) 
	: Digraph(numv, maxe), s(s1), t(t1) {
        assert(N >= 2 && maxEdge >= 0 && 1 <= s && s <= N 
		&& 1 <= t && t <= N && s != t);
	makeSpace(numv,maxe);
}

/** Copy constructor - not implemented. */
Flograph::Flograph(const Flograph& original) : Digraph(original) { }

Flograph::~Flograph() { freeSpace(); }

/** Allocate and initialize dynamic storage for graph.
 *  @param numv is number of vertices in graph
 *  @param maxe is max possible number of edges in graph
 */
void Flograph::makeSpace(int numv, int maxe) {
        floInfo = new FloInfo[maxe+1];
}

/** Free dynamic storage. */
void Flograph::freeSpace() { delete [] floInfo; }

/** Resize flograph. 
 *  Current graph is discarded, space is freed and new space allocated.
 *  @param numv is number of vertices in graph
 *  @param maxe is max possible number of edges in graph
 */
void Flograph::resize(int numv, int maxe) {
        Digraph::resize(numv, maxe);
        freeSpace(); makeSpace(numv, maxe);
}

void Flograph::reset() { Digraph::reset(); }

/** Copy contents of original to *this.
 *  @param original is a flowgraph which is to be copied to *this
 */
void Flograph::copyFrom(const Flograph& original) {
        if (N != original.n() || maxEdge < original.m()) {
                resize(original.n(), original.m());
        } else {
                reset();
        }
        N = original.n();
        for (edge e = original.first(); e != 0; e = original.next(e)) {
                edge ee = join(original.left(e),original.right(e));
		cpy(ee) = original.cpy(e); flo(ee) = original.flo(e);
        }
	setSrcSnk(original.src(),original.snk());
        sortAdjLists();
}

/** Join two vertices with an edge.
 *  @param u is a vertex number
 *  @param v is a vertex number
 *  @return number of new edge from u to v
 */
edge Flograph::join(vertex u, vertex v) {
	assert(1 <= u && u <= N && 1 <= v && v <= N && M < maxEdge);
	edge e = Digraph::join(u,v); flo(e) = 0;
	return e;
}

/** Remove flow from all edges.
 */
void Flograph::clear() {
	for (edge e = first(); e != 0; e = next(e))
		addFlow(tail(e),e,-f(tail(e),e));
}

/** Add to the flow on an edge.
 *  @param v is a vertex
 *  @param e is an edge with v as one of its endpoints
 *  @param ff is a flow to be added to e, from v to the other endpoint
 *  @return the amount of flow on the edge leaving v, after ff has been added
 */
flow Flograph::addFlow(vertex v, edge e, flow ff) {
	if (tail(e) == v) {
		if (ff + flo(e) > cpy(e) || ff + flo(e) < 0) {
			fatal("addflow: requested flow outside allowed range");
		}
		flo(e) += ff;
		return flo(e);
	} else {
		if (flo(e) - ff < 0 || flo(e) - ff > cpy(e)) {
			fatal("addflow: requested flow outside allowed range");
		}
		flo(e) -= ff;
		return -flo(e);
	}
}

/** Read an edge from the input stream and add it to the flograph.
 *  @param in is an open input stream
 *  @return true if the operation is successful, else false
 */
bool Flograph::readEdge(istream& in) {
        vertex u, v; flow capp, ff;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,N) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,N) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,capp) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,ff) || 
	    Util::readNext(in,')') == 0)
		return false;

	if (u < 1 || u > n() || v < 1 || v > n()) return false;
        edge e; e = join(u,v);
	if (e == 0) return false;
	setCapacity(e,capp); addFlow(u,e,ff);

        return true;

}

/** Read a flograph from an input stream and assign to this object.
 *  @param in is an open input stream
 *  @return true on success, false on failure
 */
bool Flograph::read(istream& in) {
        int numv, nume;
        in >> numv >> nume;
        if (numv != N || nume > maxEdge) resize(numv,nume);
	else reset();
        N = numv;

	vertex src, snk;
	if (!Util::readNode(in,src,N) || !Util::readNode(in,snk,N))
		return false;
	setSrcSnk(src,snk);

	for (int i = 1; i <= nume; i++)
		if (!readEdge(in)) return false;
	if (M != nume) return false;
        return true;
}

/** Create readable representation of an edge.
 *  @param e is an edge
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
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

/** Create readable representation of this flograph.
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
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

/** Create graphviz representation of this flograph.
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
string& Flograph::toDotString(string& s) const {
	int i; vertex u; edge e;
	stringstream ss;
	ss << "digraph G { " << endl;
        ss << Util::node2string(src(),n(),s) 
           << " [ style = bold, peripheries = 2, color = red]; "
           << endl;
	ss << Util::node2string(snk(),n(),s) 
           << " [ style = bold, peripheries = 2, color = blue]; "
           << endl;
	for (u = 1; u <= n(); u++) {
                string su;
		for (e = firstOut(u); e != 0; e = nextOut(u,e)) {
                        vertex u = tail(e); vertex v = head(e);
                        string s1;
                        if (e != 0) {
                                su += Util::node2string(u,N,s1) + " -> "; 
                                s1.clear();
                                su += Util::node2string(v,N,s1); 
                                s1.clear(); su += " [label = \" ";
                                su += "(" + Util::num2string(cap(u,e),s1); 
                                s1.clear();
                                su += "," + Util::num2string(f(u,e),s1) 
                                        + ") \"]; "; 
                        }
                }
                if (!su.empty())   ss << su << endl;
	}
	ss << " } " << endl;
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
	FloInfo *floInfo1 = new FloInfo[M+1];

        Digraph::shuffle(vp,ep);
        for (e = 1; e <= M; e++) floInfo1[ep[e]] = floInfo[e];
        for (e = 1; e <= M; e++) floInfo[e] = floInfo1[e];
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

	if (N != numv || maxEdge < nume) resize(numv,nume); 
	else reset();

	Digraph::rgraph(numv-2,nume-2*mss);
	N = numv;
	setSrcSnk(numv-1,numv);

	vertex *neighbors = new vertex[2*mss+1];
	Util::genPerm(2*mss,neighbors);
	for (int i = 1; i <= mss; i++) {
		join(src(),neighbors[i]);
	}
	Util::genPerm(2*mss,neighbors);
	for (int i = 1; i <= mss; i++) {
		join(((numv-2)/2)+neighbors[i],snk());
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
			setCapacity(e,randint(1,ec1));
		else
			setCapacity(e,randint(1,ec2));
	}
}
