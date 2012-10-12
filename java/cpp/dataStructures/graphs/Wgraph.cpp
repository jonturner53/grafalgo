/** @file Wgraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wgraph.h"

/** Construct a Wgraph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxEdge1 is the maximum number of edges
 */
Wgraph::Wgraph(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv, maxe);
}

/** Copy constructor - not implmented. */
Wgraph::Wgraph(const Wgraph& original) : Graph(original) { }

/** Allocate and initialize dynamic storage for graph.
 */
void Wgraph::makeSpace(int numv, int maxe) {
        wt = new int[maxe+1];
}

/** Free space used by Wgraph */
Wgraph::~Wgraph() { freeSpace(); }

void Wgraph::freeSpace() { delete [] wt; }

void Wgraph::resize(int numv, int maxe) {
	Graph::resize(numv, maxe);
	freeSpace(); makeSpace(numv, maxe);
}

void Wgraph::reset() { Graph::reset(); }

/** Copy another Graph to this one.
 *  @param original is another graph that is to replace this one.
 */
void Wgraph::copyFrom(const Wgraph& original) {
        if (N != original.n() || maxEdge < original.m()) {
                resize(original.n(), original.m());
        } else {
                reset();
        }
        N = original.n();
        for (edge e = original.first(); e != 0; e = original.next(e)) {
                edge ee = join(original.left(e),original.right(e));
		setWeight(ee,original.weight(e));
        }
        sortAdjLists();
}

/** Read one edge from an input stream, add it to the graph.
 *  Since for undirected graphs, edges appear on both adjacency lists,
 *  ignore an edge if its second vertex is larger than the first.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wgraph::readEdge(istream& in) {
        vertex u, v; int w;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,w)      ||
	    Util::readNext(in,')') == 0)
                return false;
        if (u < 1 || u > n() || v < 1 || v > n()) return false;
	edge e;
        if (u < v) { e = join(u,v); setWeight(e,w); }

        return true;
}

/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wgraph::edge2string(edge e, string& s) const {
        s = "(";
        string s1;
        vertex u = left(e); vertex v = right(e);
        s += Util::node2string(u,n(),s1) + ",";
        s += Util::node2string(v,n(),s1) + ",";
	s += Util::num2string(wt[e],s1) + ")";
        return s;
}

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @param u is one of the endponts of e; it will appear first in the string
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wgraph::edge2string(edge e, vertex u, string& s) const {
        s = "(";
        string s1;
        vertex v = mate(u,e);
        s += Util::node2string(u,n(),s1) + ",";
        s += Util::node2string(v,n(),s1) + ",";
	s += Util::num2string(wt[e],s1) + ")";
        return s;
}

/** Assign edges a random weight in given range.
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Wgraph::randWeight(int lo, int hi) {
        for (edge e = first(); e != 0; e = next(e))
		setWeight(e,randint(lo,hi));
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
	// undirected graph
	ss << "graph G { " << endl;
	for (vertex u = 1; u <= n(); u++) {
		if (firstAt(u) == 0) break;
		string su;
		for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
			vertex v = mate(u,e);
                        string s1,s2;
			if (v > u)  break;
			su += Util::node2string(u,n(),s1) + " -- ";
			su += Util::node2string(v,n(),s2);
			su += " [label = \" ";
                        ostringstream convert;
                        convert << weight(e);
                        su += convert.str();
                        su += " \"]; "; 
		}
                if (!su.empty())   ss << su << endl;
	}
	ss << " } " << endl;
	s = ss.str();
	return s;
}
