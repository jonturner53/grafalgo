/** @file Graph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph.h"

namespace grafalgo {

/** Construct a Graph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the Graph
 *  @param maxe is the maximum number of edges
 */
Graph::Graph(int numv, int maxe) : Adt(numv), maxEdge(maxe) {
	makeSpace(numv,maxe); 
}

Graph::~Graph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Graph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph::makeSpace(int numv, int maxe) {
	try {
		fe = new edge[numv+1];
		evec = new EdgeInfo[maxe+1];
		edges = new ListPair(maxe);
		adjLists = new ClistSet(2*maxe+1);
	} catch (std::bad_alloc e) {
		string s = "Graph::makeSpace: insufficient space for "
			   + to_string(numv) + "vertices and "
			   + to_string(maxe) + " edges";
		throw OutOfSpaceException(s);
	}
	for (vertex u = 0; u <= numv; u++) fe[u] = 0;
	for (edge e = 0; e <= maxe; e++) evec[e].l = 0;
	nn = numv; mm = 0; maxEdge = maxe;
}

/** Free space used by graph. */
void Graph::freeSpace() {
	delete [] fe; delete [] evec; delete edges; delete adjLists;
}

/** Resize a Graph object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph::resize(int numv, int maxe) {
	freeSpace();
	try { makeSpace(numv,maxe); } catch(OutOfSpaceException e) {
		string s = "Graph::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this Graph.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Graph::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= maxEdge) return;
	Graph old(this->n(),this->maxEdge); old.copyFrom(*this);
	resize(numv,maxe); this->copyFrom(old);
}

/** Remove all edges from graph. */
void Graph::clear() { while (first() != 0) remove(first()); }

/** Copy into list from source. */
void Graph::copyFrom(const Graph& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > maxEdge)
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e))
		join(source.left(e),source.right(e));
}

/** Join two vertices with an edge.
 *  @param u is the left endpoint for the new edge
 *  @param v is the right endpoint for the new edge
 *  @return the edge number for the new edge or 0
 *  on failure
 */
edge Graph::join(vertex u, vertex v) {
	assert(validVertex(u) && validVertex(v));

	edge e = edges->firstOut();
	edge ee = joinWith(u,v,e);
	return ee;
}

/** Join two vertices with a specific edge.
 *  @param u is the left endpoint for the new edge
 *  @param v is the right endpoint for the new edge
 *  @param e is the number of an idle edge
 *  @return the edge number for the new edge or 0
 *  on failure
 */
edge Graph::joinWith(vertex u, vertex v, edge e) {
	if (e == 0 || !edges->isOut(e)) return 0;
	edges->swap(e);

	// initialize edge information
	evec[e].l = u; evec[e].r = v;

	// add edge to the adjacency lists
	// in the adjLists data structure, each edge appears twice,
	// as 2*e and 2*e+1
	if (fe[u] != 0) adjLists->join(2*e,fe[u]);
	if (fe[v] != 0) adjLists->join(2*e+1,fe[v]);
	if (fe[u] == 0) fe[u] = 2*e;
	if (fe[v] == 0) fe[v] = 2*e+1;

	mm++;

	return e;
}

/** Remove an edge from the Graph.
 *  @param e is the edge to be removed.
 *  @return true on success, false on failure
 */
bool Graph::remove(edge e) {
	assert(validEdge(e));
	edges->swap(e);

	vertex u = evec[e].l;
	if (fe[u] == 2*e)
		fe[u] = (adjLists->suc(2*e) == 2*e ? 0 : adjLists->suc(2*e));
	u = evec[e].r;
	if (fe[u] == 2*e+1)
		fe[u] = (adjLists->suc(2*e+1) == 2*e+1 ?
				0 : adjLists->suc(2*e+1));

	adjLists->remove(2*e); adjLists->remove(2*e+1);

	evec[e].l = 0;

	mm--;
	return true;
}

// Compare two edges incident to the same endpoint u.
// Return -1 if u's mate in e1 is less than u's mate in e2.
// Return +1 if u's mate in e1 is greater than than u's mate in e2.
// Return  0 if u's mate in e1 is equal to its mate in e2.
int Graph::ecmp(edge e1, edge e2, vertex u) const {
	if (mate(u,e1) < mate(u,e2)) return -1;
	else if (mate(u,e1) > mate(u,e2)) return 1;
	else return 0;
}

/** Sort an adjacency list for a specified vertex using ecmp().
 *  @param u is the vertex whose adjacency list is to be sorted.
 */
void Graph::sortAlist(vertex u) {
	edge e; int j, k, p, c;

	if (fe[u] == 0) return; // empty list

	int  *elist = new int[n()+1];

	// copy edges in adjacency list for u into an array
	k = 1; elist[k++] = fe[u];
	for (e = adjLists->suc(fe[u]); e != fe[u]; ) {
		if (k > n()) {
			Util::fatal("Graph::sortAlist: adjacency list "
				    "too long");
		}
		elist[k++] = e;
		edge f = e; e = adjLists->suc(e); adjLists->remove(f);
	}
	k--;
	// put edge list in heap-order using mate(u) as key
	for (j = k/2; j >= 1; j--) {
		// do pushdown starting at position j
		e = elist[j]; p = j;
		while (1) {
			c = 2*p;
			if (c > k) break;
			if (c+1 <= k && ecmp(elist[c+1]/2,elist[c]/2,u) > 0)
				c++;
			if (ecmp(elist[c]/2,e/2,u) <= 0) break;
			elist[p] = elist[c]; p = c;
		}
		elist[p] = e;
	}
	// repeatedly extract the edge with largest mate(u) from heap and
	// restore heap order
	for (j = k-1; j >= 1; j--) {
		e = elist[j+1]; elist[j+1] = elist[1];
		// now largest edges are in positions j+1,...,k
		// elist[1,...,j] forms a heap with edge having
		// largest mate(u) on top
		// pushdown from 1 in this restricted heap
		p = 1;
		while (1) {
			c = 2*p;
			if (c > j) break;
			if (c+1 <= j && ecmp(elist[c+1]/2,elist[c]/2,u) > 0)
				c++;
			if (ecmp(elist[c]/2,e/2,u) <= 0) break;
			elist[p] = elist[c]; p = c;
		}
		elist[p] = e;
	}
	// now elist is sorted by mate(u)

	// now rebuild links forming adjacency list for u
	for (j = k-1; j >= 1; j--) {
		adjLists->join(elist[j],elist[j+1]);
	}
	fe[u] = elist[1];

	delete [] elist;
}

/** Sort all the adjacency lists. */
void Graph::sortAdjLists() {
	for (vertex u = 1; u <= n(); u++) sortAlist(u);
}

/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @return the string
 */
string Graph::edge2string(edge e) const {
	return edge2string(e,left(e));
}

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @param u is one of the endponts of e; it will appear first in the string
 *  @return the string
 */
string Graph::edge2string(edge e, vertex u) const {
	string s = "(";
	vertex v = mate(u,e);
	s += item2string(u) + ",";
	s += item2string(v) + ")";
	return s;
}

/** Create a string representation of an edge list.
 *  @param elist is a reference to a list of edge numbers
 *  @return the string
 */
string Graph::elist2string(list<edge>& elist) const {
	string s;
	int i = elist.size();
	for (edge e : elist) {
		s += edge2string(e);
		if (--i) s += " ";
	}
	return s;
}

string Graph::elist2string(List& elist) const {
	string s = "";
	for (edge e = elist.first(); e != 0; e = elist.next(e)) {
		s += edge2string(e);
		if (e != elist.last()) s += " ";
	}
	return s;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Graph::adjList2string(vertex u) const {
	string s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::item2string(u) + ":";
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		vertex v = mate(u,e);
		s += " " + item2string(v);
		if (++cnt >= 20 && nextAt(u,e) != 0) {
			s += "\n"; cnt = 0;
		}
	}
	s += "]\n";
	return s;
}

/** Construct a string representation of the Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Graph::toString() const {
	string s = "{\n";
	for (vertex u = 1; u <= n(); u++) {
		s += adjList2string(u);
	}
	s += "}\n";
	return s;
}

/** Construct a string in dot file format representation 
 * of the Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Graph::toDotString() const {
	string s = "graph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		s += Adt::item2string(u) + " -- ";
		s += Adt::item2string(v) + " ; "; 
		if (++cnt == 15) { cnt = 0; s += "\n"; }
	}
	s += "}\n";
	return s;
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph::readAdjList(istream& in) {
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
		if (u > v) join(u,v);
	}
	return in.good();
}

/** Read a graph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
istream& operator>>(istream& in, Graph& g) {
	g.clear();
	bool ok = Util::verify(in,'{');
	while (ok && !Util::verify(in,'}')) ok = g.readAdjList(in);
	if (!ok) {
		string s = "misformatted input for Graph object";
		throw InputException(s);
	}
	g.sortAdjLists();
	return in;
}

/** Get an edge joining two vertices.
 *  @param u is a vertex number
 *  @param v is a vertex number
 *  @return the number of some edge joining u and v, or 0 if there
 *  is no such edge
 */
edge Graph::getEdge(vertex u, vertex v) const {
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e))
		if (mate(u,e) == v) return e;
	return 0;
}

/** Get the components of a graph.
 *  @param component is an array that is used to return the result of
 *  the computation; if component is not NULL, then it is expected to
 *  point to an array with at least n()+1 integers; on return component[u]
 *  is an integer "component number"; vertices with the same component
 *  number are in the same connected component of the graph; callers interested
 *  only in the number of components may use a NULL argument
 *  @return the number of connected components
 */
int Graph::getComponents(int *component) const {
	bool noComp = (component == NULL);
	if (noComp) component = new int[n()+1];
	for (vertex u = 1; u <= n(); u++) component[u] = 0;
	
	List q(n());
	int curComp = 0;
	vertex s = 1;
	while (s <= n()) {
		// do a breadth-first search from s, labeling all vertices
		// found with the current component number
		component[s] = ++curComp; q.addLast(s);
		while (!q.empty()) {
			vertex u = q.first(); q.removeFirst();
			for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
				vertex v = mate(u,e);
				if (component[v] == 0) {
					component[v] = curComp;
					q.addLast(v);
				}
			}
		}
		// scan ahead to next vertex that has not yet been placed in
		// some component
		while (s <= n() && component[s] != 0) s++;
	}
	if (noComp) delete [] component;
	return curComp;
}

} // ends namespace
