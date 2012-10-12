/** @file Wdigraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Wdigraph.h"

/** Construct a Wdigraph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Wdigraph::Wdigraph(int numv, int maxe) : Digraph(numv,maxe) {
	makeSpace(numv,maxe);
}

/** Copy constructor - not implemented. */
Wdigraph::Wdigraph(const Wdigraph& original) : Digraph(original) { }

/** Allocate and initialize dynamic storage for graph.
 */
void Wdigraph::makeSpace(int numv, int maxe) {
	len = new int[maxe+1];
	for (edge e = 0; e <= maxe; e++) len[e] = 0;
} 

/** Free space used by Wdigraph */
Wdigraph::~Wdigraph() { freeSpace(); }

void Wdigraph::freeSpace() {
delete [] len;
}

/** Copy another Wdigraph to this one.
 *  @param original is another graph that is to replace this one.
 */
void Wdigraph::copyFrom(const Wdigraph& original) {
        if (N < original.n() || maxEdge < original.m()) {
                resize(original.n(), original.m());
        } else {
                reset();
        }
        N = original.n();
        for (edge e = original.first(); e != 0; e = original.next(e)) {
                edge ee = join(original.left(e),original.right(e));
                setLength(ee,original.length(e));
        }
        sortAdjLists();
}

void Wdigraph::resize(int numv, int maxe) {
        Digraph::resize(numv, maxe);
        freeSpace(); makeSpace(numv, maxe);
}

void Wdigraph::reset() { Digraph::reset(); }


/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Wdigraph::edge2string(edge e, string& s) const {
        s = "(";
        string s1;
        vertex u = tail(e); vertex v = head(e);
        s += Util::node2string(u,n(),s1) + ",";
        s += Util::node2string(v,n(),s1) + ",";
        s += Util::num2string(length(e),s1) + ")";
        return s;
}

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
	// undirected graph
	ss << "digraph G { " << endl;
	for (vertex u = 1; u <= n(); u++) {
		if (firstAt(u) == 0) break;
		string su;
		for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
			vertex v = mate(u,e);
                        string s1, s2;
			if (v > u)  break;
			su += Util::node2string(u,n(),s1) + " -> ";
			su += Util::node2string(v,n(),s1);
			su += " [label = \" ";
                        ostringstream convert;
                        convert << length(e);
                        su += convert.str();
                        su += " \"]; "; 
		}
                if (!su.empty())   ss << su << endl;
	}
	ss << " } " << endl;
	s = ss.str();
	return s;
}

/** Read one edge from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Wdigraph::readEdge(istream& in) {
        vertex u, v; int len;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNum(in,len) ||
            Util::readNext(in,')') == 0) {
                return false;
        }
        edge e = join(u,v);
	setLength(e,len);

        return true;
}

/** Assign edges a random lengths in given range.
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Wdigraph::randLength(int lo, int hi) {
        for (edge e = first(); e != 0; e = next(e))
                setLength(e,randint(lo,hi));
}
