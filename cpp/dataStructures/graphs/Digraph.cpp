/** @file Digraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Digraph.h"

namespace grafalgo {

/** Construct a Digraph with space for a specified number of vertices and edges.
 *  @param numv is the maximum number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Digraph::Digraph(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(numv,maxe);
}

Digraph::~Digraph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Digraph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Digraph::makeSpace(int numv, int maxe) {
	try {
		fi = new edge[numv+1];
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "Digraph::makeSpace: insufficient space for "
		   << numv << "vertices and " << maxe << " edges";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	for (vertex u = 0; u <= numv; u++) fi[u] = 0;
	nn = numv;
}

/** Free space used by graph. */
void Digraph::freeSpace() { delete [] fi; }

/** Resize a Digraph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Digraph::resize(int numv, int maxe) {
	freeSpace();
	Graph::resize(numv,maxe);
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s; s = "Digraph::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Digraph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Digraph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Digraph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

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
	if (fe[u] == 0) fe[u] = 2*e;
	else adjLists->join(2*e,fe[u]);
	if (fi[v] == 0) fi[v] = 2*e+1;
	else adjLists->join(2*e+1,fi[v]);

	mm++;

	return e;
}

/** Remove an edge from the Diraph.
 *  @param e is the edge to be removed.
 *  @return true on success, false on failure
 */
bool Digraph::remove(edge e) {
	assert(validEdge(e));
	edges->swap(e);

	vertex u = evec[e].l;
	if (fe[u] == 2*e)
		fe[u] = (adjLists->suc(2*e) == 2*e ? 0 : adjLists->suc(2*e));
	u = evec[e].r;
	if (fi[u] == 2*e+1)
		fi[u] = (adjLists->suc(2*e+1) == 2*e+1 ?
				0 : adjLists->suc(2*e+1));

	adjLists->remove(2*e); adjLists->remove(2*e+1);

	evec[e].l = 0;

	mm--;
	return true;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Digraph::adjList2string(vertex u, string& s) const {
	s = "";
	if (firstOut(u) == 0) return s;
	int cnt = 0;
	string s1;
	s += "[" + Adt::item2string(u,s1) + ":";
	for (edge e = firstOut(u); e != 0; e = nextOut(u,e)) {
		vertex v = head(e);
		s += " " + Adt::item2string(v,s1);
		if (++cnt >= 20 && nextOut(u,e) != 0) {
			s += "\n"; cnt = 0;
		}
	}
	s += "]\n";
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
	s = "digraph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = tail(e); vertex v = head(e);
		string s1;
		s += Adt::item2string(u,s1) + " -> ";
		s += Adt::item2string(v,s1) + " ; "; 
		if (++cnt == 15) { cnt = 0; s += "\n"; }
	}
	s += "}\n";
	return s;
}

/** Read one edge from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
/*
bool Digraph::readEdge(istream& in) {
        vertex u, v;
        if (!Util::verify(in,'(') || !Adt::readItem(in,u) ||
            !Util::verify(in,',') || !Adt::readItem(in,v) ||
            !Util::verify(in,')')) {
                return false;
        }
	if (u < 1 || v < 1) return false;

	int numv = n(); int maxe = maxEdge;
	if (u > n() || v > n()) numv = max(max(u,v),2*n());
	if (m() >= maxEdge) maxe = 2*maxEdge;
	if (numv > n() || maxe > maxEdge) resize(numv,maxe);

	join(u,v);
	return true;
}
*/

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Digraph::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return 0;
	vertex u;
	if (!Adt::readItem(in,u)) return 0;
	if (u > n()) expand(u,m());
	if (!Util::verify(in,':')) return 0;
	while (in.good() && !Util::verify(in,']')) {
		vertex v;
		if (!Adt::readItem(in,v)) return 0;
		if (v > n()) expand(v,m());
		if (m() >= maxEdge) expand(n(),max(1,2*m()));
		join(u,v);
	}
	return in.good();
}

/** Read a graph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
/*
istream& operator>>(istream& in, Digraph& dg) {
	bool ok = Util::verify(in,'{');
	while (ok && !Util::verify(in,'}')) ok = dg.readEdge(in);
	if (!ok) {
		string s = "misformatted input for Graph object";
		throw InputException(s);
	}
	dg.sortAdjLists();
	return in;
}
*/

/** Generate a random digraph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Digraph::rgraph(int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (numv > n() || nume > maxEdge) resize(numv,nume); 
        else clear();

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
		vertex u = Util::randint(1,numv);
		vertex v = Util::randint(1,numv);
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
		int j = Util::randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
	sortAdjLists();
}

/** Generate a random directed acyclic graph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Digraph::rdag(int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (n() < numv || maxEdge < nume) resize(numv,nume); 
        else clear();

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
		vertex u = Util::randint(1,numv-1);
		vertex v = Util::randint(u+1,numv);
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
	for (vertex u = 1; u < numv; u++) {
		for (vertex v = u+1; v <= numv; v++) {
			if (v == u) continue;
			uint64_t vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) vpVec.push_back(vpair);
		}
	}
	// sample remaining edges from vector
	int i = 0;
	while (m() < nume && i < vpVec.size()) {
		int j = Util::randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
	sortAdjLists();
}

} // ends namespace
