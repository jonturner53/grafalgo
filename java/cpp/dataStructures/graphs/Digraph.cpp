/** @file Digraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Digraph.h"

/** Construct a Digraph with space for a specified number of vertices and edges.
 *  @param numv is the maximum number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Digraph::Digraph(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv,maxe);
}

/** Copy constructor - not implemented. */
Digraph::Digraph(const Digraph& original) : Graph(original) { }

/** Allocate and initialize dynamic storage for graph.
 */
void Digraph::makeSpace(int numv, edge maxe) {
	fi = new edge[numv+1];
	for (vertex u = 0; u <= numv; u++) fi[u] = 0;
} 

/** Free space used by Digraph */
Digraph::~Digraph() { freeSpace(); }

void Digraph::freeSpace() {
	delete [] fi;
}

/** Copy another Graph to this one.
 *  @param original is another graph that is to replace this one.
 */
void Digraph::copyFrom(const Digraph& original) {
        if (N != original.n() || maxEdge < original.m()) {
                resize(original.n(), original.m());
        } else {
                reset();
        }
        N = original.n();
        for (edge e = original.first(); e != 0; e = original.next(e)) {
                join(original.left(e),original.right(e));
        }
        sortAdjLists();
}

/** Discard current graph and allocate space for a new graph.
 *  @param numv is the number of vertices in the new graph
 *  @param maxe is the maximum number of edges in the new graph
 */
void Digraph::resize(int numv, int maxe) {
        Graph::resize(numv, maxe);
        freeSpace(); makeSpace(numv, maxe);
}

/** Remove all edges from the graph.  */
void Digraph::reset() {
	Graph::reset();
	for (vertex u = 0; u <= n(); u++) fi[u] = 0;
}

/** Join two vertices with an edge.
 *  @param u is the tail of the new edge
 *  @param v is the head of the new edge
 *  @return the edge number for the new edge, or 0 on failure
 */
edge Digraph::join(vertex u, vertex v) { return Graph::join(u,v); }

/** Join two vertices with a specific edge.
 *  @param u is the tail of the new edge
 *  @param v is the head of the new edge
 *  @param e is the number of an idle edge
 *  @return the edge number for the new edge, or 0 on failure
 */
edge Digraph::joinWith(vertex u, vertex v, edge e) {
	assert(validVertex(u) && validVertex(v));

	if (e == 0 || !edges->isOut(e)) return 0;
	edges->swap(e);

	// initialize edge information
	evec[e].l = u; evec[e].r = v;

	// add edge to the adjacency lists
	// in the adjLists data structure, each edge appears twice,
	// as 2*e and 2*e+1
	if (fe[u] != 0) {
		adjLists->join(2*e,fe[u]);
	}
	if (fi[v] != 0) {
		adjLists->join(2*e+1,fi[v]);
	}
	if (fe[u] == 0) fe[u] = 2*e;
	if (fi[v] == 0) fi[v] = 2*e+1;

	M++;

	return e;
}

string& Digraph::edge2string(edge e, string& s) const {
	return Graph::edge2string(e,s);
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Digraph::alist2string(vertex u, string& s) const {
        s = "";
        if (firstAt(u) == 0) return s;
        int cnt = 0;
        for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
                string s1;
                s += edge2string(e,s1) + " ";
                cnt++;
                if (cnt >= 10) { s += "\n"; cnt = 0; }
        }
        if (cnt != 0) s += "\n";
        return s;
}

/** Construct a string in dot file format representation 
 * of the Directed Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @param s is a string object provided by the caller which
 *  is modified to provide a representation of the Graph.
 *  @return a reference to the string
 */
string& Digraph::toDotString(string& s) const {
	stringstream ss;
	// directed graph
	ss << "digraph G { " << endl;
	for (vertex u = 1; u <= n(); u++) {
		if (firstAt(u) == 0) break;
		string su;
		for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
                        string s1, s2;
			vertex v = mate(u,e);
			su += Util::node2string(u,n(),s1) + " -> ";
			su += Util::node2string(v,n(),s2);
			su += " ; "; 
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
bool Digraph::readEdge(istream& in) {
        vertex u, v;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,n()) ||
            Util::readNext(in,')') == 0) {
                return false;
        }
        join(u,v);
        return true;
}

/** Read a graph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
bool Digraph::read(istream& in) {
        int numv, maxe;
        in >> numv >> maxe;
	if (N != numv || maxEdge < maxe) resize(numv,maxe);
	else reset();
	N = numv;
        for (int i = 1; i <= maxe; i++) {
                if (!readEdge(in)) return false;
        }
        if (M != maxe) return false;
        sortAdjLists();
        return true;
}

/** Generate a random digraph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has N>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Digraph::rgraph(int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (numv > N || nume > maxEdge) resize(numv,nume); 
        else reset();

	// build set containing edges already in graph
	HashSet edgeSet(nume);
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(tail(e), head(e));
		vertex v = max(tail(e), head(e));
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		edgeSet.insert(vpair);
	}

	// add edges using random sampling of vertex pairs
	// stop early if graph gets so dense that most samples
	// repeat edges already in graph
	while (m() < nume && m()/numv < numv/2) {
		vertex u = randint(1,numv);
		vertex v = randint(1,numv);
		if (u == v) continue;
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		if (!edgeSet.member(vpair)) {
			edgeSet.insert(vpair); join(u,v);
		}
	}
	if (m() == nume) return;

	// if more edges needed, build a vector containing remaining 
	// "candidate" edges and then sample from this vector
	vector<uint64_t> vpVec;
	unsigned int i = 0;
	for (vertex u = 1; u < numv; u++) {
		for (vertex v = 1; v <= numv; v++) {
			if (v == u) continue;
			uint64_t vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) vpVec[i++] = vpair;
		}
	}
	// sample remaining edges from vector
	i = 0;
	while (m() < nume && i < vpVec.size()) {
		int j = randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
	sortAdjLists();
}

/** Generate a random directed acyclic graph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has N>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Digraph::rdag(int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (N < numv || maxEdge < nume) resize(numv,nume); 
        else reset();

	// build set containing edges already in graph
	HashSet edgeSet(nume);
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(tail(e), head(e));
		vertex v = max(tail(e), head(e));
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		edgeSet.insert(vpair);
	}

	// add edges using random sampling of vertex pairs
	// stop early if graph gets so dense that most samples
	// repeat edges already in graph
	while (m() < nume && m()/numv < numv/4) {
		vertex u = randint(1,numv-1);
		vertex v = randint(u+1,numv);
		if (u == v) continue;
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		if (!edgeSet.member(vpair)) {
			edgeSet.insert(vpair); join(u,v);
		}
	}
	if (m() == nume) return;

	// if more edges needed, build a vector containing remaining 
	// "candidate" edges and then sample from this vector
	vector<uint64_t> vpVec;
	unsigned int i = 0;
	for (vertex u = 1; u < numv; u++) {
		for (vertex v = u+1; v <= numv; v++) {
			if (v == u) continue;
			uint64_t vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) vpVec[i++] = vpair;
		}
	}
	// sample remaining edges from vector
	i = 0;
	while (m() < nume && i < vpVec.size()) {
		int j = randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
	sortAdjLists();
}
