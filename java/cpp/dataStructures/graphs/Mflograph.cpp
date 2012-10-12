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

/** Copy constructor - not implemented. */
Mflograph::Mflograph(const Mflograph& original) : Flograph(original) { }

Mflograph::~Mflograph() { freeSpace(); }

/** Allocate and initialize dynamic storage for graph.
 *  @param numv is the number of vertices in the graph
 *  @param maxe is the max number of edges in the graph
 */  
void Mflograph::makeSpace(int numv, int maxe) {
        mflo = new flow[maxe+1];
}

/** Free dynamic storage. */
void Mflograph::freeSpace() { delete [] mflo; }

/** Resize the flograph.
 *  The old flograph is discarded and new space allocated.
 *  @param numv is the number of vertices in the graph
 *  @param maxe is the max number of edges in the graph
 */
void Mflograph::resize(int numv, int maxe) {
        Flograph::resize(numv, maxe);
        freeSpace(); makeSpace(numv, maxe);
}

/** Remove all the edges from the graph. */
void Mflograph::reset() { Flograph::reset(); }

/** Copy contents of another Mflograph.
 *  @param original is a weighted flograph to be copied to this object
 */
void Mflograph::copyFrom(const Mflograph& original) {
        if (N != original.n() || maxEdge < original.m()) {
                resize(original.n(), original.m()); 
        } else {
                reset();
        } 
        N = original.n();
        for (edge e = original.first(); e != 0; e = original.next(e)) {
                edge ee = join(original.left(e),original.right(e));
                cpy(ee) = original.cpy(e); mflo(ee) = original.mflo(e);
                flo(ee) = original.flo(e);
        }
        setSrcSnk(original.src(),original.snk());
        sortAdjLists();
}

/** Join two vertices with an edge.
 *  @param u is a vertex
 *  @param v is a vertex
 *  @return the number of the new edge
 */
edge Mflograph::join(vertex u, vertex v) {
	assert(1 <= u && u <= N && 1 <= v && v <= N && M < maxEdge);
	edge e = Flograph::join(u,v); mflo[e] = 0;
	return e;
}

/** Read one edge from an input stream and add it to this Mflograph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
bool Mflograph::readEdge(istream& in) {
        vertex u, v; flow capp, ff; flow mc;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,N) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,N) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,capp) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,mc) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,ff) || 
	    Util::readNext(in,')') == 0)
		return false;

	if (u < 1 || u > n() || v < 1 || v > n()) return false;
        edge e = join(u,v);
	setCapacity(e,capp); setMinFlo(e,mc); addFlow(u,e,ff);

        return true;
}

/** Create a string representation of an edge.
 *  @param e is an edge
 *  @param s is a string in which the result is returned
 *  @return a reference to s
 */
string& Mflograph::edge2string(edge e, string& s) const {
	s = "";
	vertex u = tail(e); vertex v = head(e);
        if (e == 0) {
               s += "-"; 
	} else {
		string s1;
		s += "(" + Util::node2string(u,N,s1); 
		s += "," + Util::node2string(v,N,s1); 
		s += "," + Util::num2string(cap(u,e),s1);
		s += "," + Util::num2string(mflo(e),s1);
		s += "," + Util::num2string(f(u,e),s1) + ")";
        }
	return s;
}

/** Shuffle the vertices and edges according to given permutations.
 *  @param vp is a permutation on 1..(# of vertices)
 *  @param ep is a permutation on 1..(# of edges)
 */
void Mflograph::shuffle(int vp[], int ep[]) {
        edge e;
	flow *mflo1 = new flow[M+1];

        Flograph::shuffle(vp,ep);
        for (e = 1; e <= M; e++) mflo1[ep[e]] = mflo[e];
        for (e = 1; e <= M; e++) mflo[e] = mflo1[e];

        delete [] mflo1;
}

/** Generate random min capacities.
 *  @param lo is the low end of the range of min capacities
 *  @param hi is the high end of the range of min capacities
 *  min capacities are generated uniformly in [lo,hi]
 */
void Mflograph::randMinFlo(flow lo, flow hi) {
	for (edge e = first(); e != 0; e = next(e))
		setMinFlo(e,randint(lo,hi));
}


/** Create graphviz representation of this flograph.
 *  @param s is a string in which result is to be returned
 *  @return a reference to s
 */
string& Mflograph::toDotString(string& s) const {
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
                           su += "," + Util::num2string(f(u,e),s1); 
                           s1.clear();
                           su += "," + Util::num2string(minFlo(e),s1) 
                              +  ") \"];"; 
                           su += "  "; 
                        }
                }
                if (!su.empty())   ss << su << endl;
	}
	ss << " } " << endl;
	s = ss.str();
	return s;
}
