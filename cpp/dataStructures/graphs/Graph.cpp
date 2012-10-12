/** @file Graph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph.h"

/** Construct a Graph with space for a specified number of vertices and edges.
 *  @param numv is number of vertices in the Graph
 *  @param maxe is the maximum number of edges
 */
Graph::Graph(int numv, int maxe) : N(numv), maxEdge(maxe) {
	assert(N > 0 && maxEdge > 0);
	M = 0;
	makeSpace(numv,maxe); 
}

Graph::Graph(const Graph& original) {
	fatal("no copy constructor for graph classes");
}

Graph::~Graph() { freeSpace(); }

/** Allocate and initialize dynamic storage for Graph.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph::makeSpace(int numv, int maxe) {
	fe = new edge[numv+1];
	evec = new EdgeInfo[maxe+1];
	edges = new UiSetPair(maxe);
	adjLists = new UiClist(2*maxe+1);
	for (vertex u = 0; u <= numv; u++) fe[u] = 0;
	for (edge e = 0; e <= maxe; e++) evec[e].l = 0;
}

/** Free space used by graph. */
void Graph::freeSpace() {
	delete [] fe; delete [] evec; delete edges; delete adjLists;
}

/** Resize the dynamic storage for a graph, discarding old contents.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph::resize(int numv, int maxe) {
	freeSpace(); makeSpace(numv, maxe);
	N = numv; maxEdge = maxe; M = 0;
}

/** Remove/initialize all the edges from a graph.  */
void Graph::reset() {
	adjLists->reset(); edges->reset();
	for (vertex u = 1; u <= n(); u++) fe[u] = 0;
	M = 0;
}

/** Copy another Graph to this one.
 *  @param original is another graph that is to replace this one.
 */
void Graph::copyFrom(const Graph& original) {
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

	M++;

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

	M--;
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

	int  *elist = new int[N+1];

	// copy edges in adjacency list for u into an array
	k = 1; elist[k++] = fe[u];
	for (e = adjLists->suc(fe[u]); e != fe[u]; ) {
		if (k > N) fatal("Graph::sortAlist: adjacency list too long");
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
	for (vertex u = 1; u <= N; u++) sortAlist(u);
}

/** Create a string representation of an edge.
 *  In the returned string, the "left" endpoint of the edge appears first.
 *  @param e is an edge number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Graph::edge2string(edge e, string& s) const {
	s = "(";
	string s1;
	vertex u = left(e); vertex v = right(e);
	s += Util::node2string(u,n(),s1) + ",";
	s += Util::node2string(v,n(),s1) + ")";
	return s;
}

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @param u is one of the endponts of e; it will appear first in the string
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Graph::edge2string(edge e, vertex u, string& s) const {
	s = "(";
	string s1;
	vertex v = mate(u,e);
	s += Util::node2string(u,n(),s1) + ",";
	s += Util::node2string(v,n(),s1) + ")";
	return s;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @param s is a reference to a string in which the result is returned
 *  @return a reference to s.
 */
string& Graph::alist2string(vertex u, string& s) const {
	s = "";
	if (firstAt(u) == 0) return s;
	int cnt = 0;
	for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
		string s1;
		s += edge2string(e,u,s1) + " ";
		cnt++;
		if (cnt >= 10) { s += "\n"; cnt = 0; }
	}
	if (cnt != 0) s += "\n";
	return s;
}

/** Construct a string representation of the Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @param s is a string object provided by the caller which
 *  is modified to provide a representation of the Graph.
 *  @return a reference to the string
 */
string& Graph::toString(string& s) const {
	stringstream ss;
	ss << n() << " " << m() << "\n";
	for (vertex u = 1; u <= n(); u++) {
		ss << alist2string(u,s);
	}
	s = ss.str();
	return s;
}

/** Construct a string in dot file format representation 
 * of the Graph object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @param s is a string object provided by the caller which
 *  is modified to provide a representation of the Graph.
 *  @return a reference to the string
 */
string& Graph::toDotString(string& s) const {
	stringstream ss;
	// undirected graph
	ss << "graph G { " << endl;
	for (vertex u = 1; u <= n(); u++) {
		if (firstAt(u) == 0) break;
		string su;
		for (edge e = firstAt(u); e != 0; e = nextAt(u,e)) {
			vertex v = mate(u,e);
                        string s1, s2;
                        if (v > u)  break;
			su += Util::node2string(u,n(),s1) + " -- ";
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
 *  Since for undirected graphs, edges appear on both adjacency lists,
 *  ignore an edge if its second vertex is larger than the first.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph::readEdge(istream& in) {
        vertex u, v;
        if (Util::readNext(in,'(') == 0 || !Util::readNode(in,u,n()) ||
            Util::readNext(in,',') == 0 || !Util::readNode(in,v,n()) ||
            Util::readNext(in,')') == 0) {
                return false;
        }
        if (u < 1 || u > n() || v < 1 || v > n()) return false;
        if (u < v) join(u,v);
        return true;
}

/** Read a graph.
 *  @param in is an open input stream
 *  @return true on success, else false
 */
bool Graph::read(istream& in) {
        int numv, nume;
        in >> numv >> nume;
	if (N != numv || maxEdge < nume) resize(numv,nume); 
        else reset();
	N = numv; M = 0;
        for (int i = 1; i <= 2*nume; i++) {
                if (!readEdge(in)) return false;
        }
        if (M != nume) return false;
        sortAdjLists();
        return true;
}

/** Scamble the vertices and edges in the graph.
 */
void Graph::scramble() {
	int *vp = new int[N+1]; int *ep = new int[maxEdge+1];
	Util::genPerm(N,vp); Util::genPerm(maxEdge,ep);
	shuffle(vp,ep);
	sortAdjLists();
}

/** Shuffle the vertices and edges according to the given permutations.
 *  More precisely, remap all vertices u to vp[u] and all edges e to ep[e].
 */
void Graph::shuffle(int vp[], int ep[]) {
	vertex u; edge e;
	EdgeInfo evec1[maxEdge+1];

	for (e = 1; e <= maxEdge; e++) evec1[e].l = evec1[e].r = 0;
	for (e = first(); e != 0; e = next(e)) evec1[e] = evec[e];
	adjLists->reset(); edges->reset();
	for (u = 1; u <= N; u++) fe[u] = 0;
	for (e = 1; e <= maxEdge; e++) {
		if (evec1[e].l != 0)
			joinWith(vp[evec1[e].l],vp[evec1[e].r],ep[e]);
	}
}

/** Generate a random graph. 
 *  @param numv is the number of vertices in the random graph;
 *  if this object has N>numv, the graph is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the graph
 */  
void Graph::rgraph(int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (numv > N || nume > maxEdge) resize(numv,nume); 
        else reset();
	addEdges(numv,nume);
	sortAdjLists();
}

/** Add random edges to a graph.
 *  @param numv is the number of vertices; edges are generated
 *  joining vertices with vertex numbers in 1..numv
 *  @param nume is the target number of edges; if the graph already
 *  has some edges, additional edges will be added until the
 *  graph has nume edges
 */
void Graph::addEdges(int numv, int nume) {
	// build set containing edges already in graph
	HashSet edgeSet(nume);
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e), right(e));
		vertex v = max(left(e), right(e));
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		edgeSet.insert(vpair);
	}

	// add edges using random sampling of vertex pairs
	// stop early if graph gets so dense that most samples
	// repeat edges already in graph
	while (m() < nume && m()/numv < numv/4) {
		vertex u = randint(1,numv);
		vertex v = randint(1,numv);
		if (u == v) continue;
		if (u > v) { vertex w = u; u = v; v = w; }
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
		vertex v;
		for (v = u+1; v <= numv; v++) {
			uint64_t vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) vpVec.push_back(vpair);
		}
	}
	// sample remaining edges from vector
	unsigned int i = 0;
	while (m() < nume && i < vpVec.size()) {
		int j = randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
}


/** Generate a random graph. 
 *  This variant is being deprecated; will probably drop soon.
 *  @param numv is the number of vertices in the random graph;
 *  if this object has N>numv, the graph is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the graph
 *  @param span is the max separation between vertices, measured
 *  circularly
 */  
void Graph::rgraph(int numv, int nume, int span) {
	numv = max(0,numv); nume = max(0,nume);
	if (N < numv || maxEdge < nume) resize(numv,nume); 
        else reset();

	if (span < numv/2) {
		// mm = # of candidate edges, m = # still to generate
		long long int mm = numv; mm *= span;
		long long int m = nume; m = min(m,mm);
		for (long long int i = 0; m > 0; m--) {
			// i is index of most recent edge generated
			// j is index of new edge
			int k = randTruncGeo(double(m)/(mm-i),mm-((m+i)-1));
			long long int j = i + k;
			vertex u = (j-1)/span + 1;
			vertex v = u + (j - (u-1)*span);
			if (v > numv) v -= numv;
			join(u,v);
			i = j;
		}
	}  else {
		long long int mm = numv; mm *= (numv-1); mm /= 2; 
		long long int m = nume; m = min(m,mm);
		for (long long int i = 0; m > 0; m--) {
			// i is index of most recent edge generated
			// j is index of new edge
			int k = randTruncGeo(double(m)/(mm-i),mm-((m+i)-1));
			long long int j = i + k;
			long long int lv = int(1 + (1+sqrt(1+8*(j-1)))/2);
			long long int lu = lv - (((lv*(lv-1)/2) - j) + 1);
			vertex u = lu; vertex v = lv;
			join(u,v);
			i = j;
		}
	}
	sortAdjLists();
}

/** Generate a random bipartite graph.
 *  @param numv specifies the number of vertices per "part"; so the resulting
 *  graph will have 2*numv vertices; if this object has N>2*numv,
 *  the random graph is generated over the first 2*numv vertices,
 *  leaving the remaining vertices with no edges
 *  @param maxEdge is the max number of edges in the random graph
 */
void Graph::rbigraph(int numv, int nume) {
	numv = max(1,numv); nume = max(0,nume);
	if (N < 2*numv || maxEdge < nume) resize(2*numv,nume); 
        else reset();

	// build set containing edges already in graph
	HashSet edgeSet(nume);
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e), right(e));
		vertex v = max(left(e), right(e));
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		edgeSet.insert(vpair);
	}

	// add edges using random sampling of vertex pairs
	// stop early if graph gets so dense that most samples
	// repeat edges already in graph
	while (m() < nume && m()/numv < numv/2) {
		vertex u = randint(1,numv);
		vertex v = randint(1,numv); v += numv;
		uint64_t vpair = u; vpair <<= 32; vpair |= v;
		if (!edgeSet.member(vpair)) {
			edgeSet.insert(vpair); join(u,v);
		}
	}
	if (m() == nume) return;

	// if more edges needed, build a vector containing remaining 
	// "candidate" edges and then sample from this vector
	vector<uint64_t> vpVec;
	for (vertex u = 1; u <= numv; u++) {
		for (vertex v = numv+1; v <= 2*numv; v++) {
			uint64_t vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) vpVec.push_back(vpair);
		}
	}
	// sample remaining edges from vector
	unsigned int i = 0;
	while (m() < nume && i < vpVec.size()) {
		int j = randint(i,vpVec.size()-1);
		vertex u = vpVec[j] >> 32;
		vertex v = vpVec[j] & 0xffffffff;
		join(u,v); vpVec[j] = vpVec[i++];
	}
	sortAdjLists();
}

/** Generate a random tree. 
 *  Generates random trees with equal probability assigned to each
 *  labeled tree; method based on Cayley's theorem
 *  @param numv is the number of vertices in the random tree;
 *  if this object has N>numv, the tree is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 */
void Graph::rtree(int numv) {
	// build a random sequence of n-2 vertex numbers
	// these can be interpreted as "edge endpoints" for
	// the non-leaf vertices in the tree to be generated;
	// as we're doing this, compute the vertex degrees
	vertex endpoints[numv-1]; int d[numv+1];
	for (int i = 1; i <= numv; i++) d[i] = 1;
	for (int i = 1; i <= numv-2; i++) {
		endpoints[i] = randint(1,numv);
		d[endpoints[i]]++;
	}
	// now build a heap containing all leaves in the tree
	// being generated
	Dheap degOne(numv,2);		// vertices with one more edge to go
	for (vertex u = 1; u <= numv; u++) {
		if (d[u] == 1) degOne.insert(u,u);
	}
	// construct tree based on Cayley's theorem
	for (int i = 1; i <= numv-2; i++) {
		vertex u = degOne.deletemin();
		vertex v = endpoints[i];
		join(u,v);
		if (--d[v] == 1) degOne.insert(v,v);
	}
	join(degOne.deletemin(),degOne.deletemin());
	sortAdjLists();
}
/* old version
void Graph::rtree(int numv) {
	vertex *verts = new vertex[numv+1];

	numv = max(0,numv);
	if (N < numv || maxEdge < numv-1) resize(numv,numv-1); 
        else reset();

	// Scan a random permutation of the vertices, joining vertices
	// on opposite sides of the current "cursor position" i
	Util::genPerm(numv,verts);
	for (int i = 2; i <= numv; i++) {
		int j = randint(1,i-1);
		int k = randint(i,numv);
		join(verts[j],verts[k]);
		int temp = verts[i]; verts[i] = verts[k]; verts[k] = temp;
	}
	sortAdjLists();
	delete [] verts;
}
*/

/** Create a random simple, connected graph.
 */
void Graph::rcgraph(int numv, int nume) {
	// try standard random graph generation
	rgraph(numv,nume);

	if (getComponents(NULL) == 1) return;
	
	// graph too sparse for standard method to produce connected graph
	// so start over, adding edges to a random tree
	reset();
	rtree(numv); addEdges(numv,nume);
	sortAdjLists();
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
 *  number are in the same connected of the graph; callers interested
 *  only in the number of components may use a NULL argument
 *  @return the number of connected components
 */
int Graph::getComponents(int *component) const {
	bool noComp = (component == NULL);
	if (noComp) component = new int[n()+1];
	for (vertex u = 1; u <= n(); u++) component[u] = 0;
	
	UiList q(n());
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
