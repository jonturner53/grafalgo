/** @file Rgraph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Hash.h"
#include "Pair.h"
#include "Rgraph.h"

namespace grafalgo {

/** Generate an undirected random graph. 
 *  @param numv is the number of vertices in the random graph;
 *  if this object has n>numv, the graph is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the graph
 */  
void Rgraph::ugraph(Graph& g, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (numv > g.n() || nume > g.M())
		 g.resize(numv,nume);
	 else g.clear();
	 addEdges(g,nume);
}

/** Add random edges to a graph.
 *  @param nume is the target number of edges; if the graph already
 *  has some edges, additional edges will be added until the
 *  graph has nume edges
 */
void Rgraph::addEdges(Graph& g, int nume) {
	 if (nume <= g.m()) return;
	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = g.first(); e != 0; e = g.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(g.left(e), g.right(e));
		 vpair.second = max(g.left(e), g.right(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (g.m() < nume && g.m()/g.n() < g.n()/4) {
		 vertex u = Util::randint(1,g.n());
		 vertex v = Util::randint(1,g.n());
		 if (u == v) continue;
		 if (u > v) { vertex w = u; u = v; v = w; }
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); g.join(u,v);
		 }
	 }
	 if (g.m() == nume) {
	 	g.sortAdjLists(); return;
	}

	 // if more edges needed, build a vector containing remaining 
	 // "candidate" edges and then sample from this vector
	 vector<Pair<vertex,vertex>> vpVec;
	 for (vertex u = 1; u < g.n(); u++) {
		 for (vertex v = u+1; v <= g.n(); v++) {
			 Pair<vertex,vertex> vpair(u,v);
			 if (!edgeSet.contains(vpair)) vpVec.push_back(vpair);
		 }
	 }
	 // sample remaining edges from vector
	 unsigned int i = 0;
	 while (g.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first;
		 vertex v = vpVec[j].second;
		 g.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 g.sortAdjLists();
}

/** Generate a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param nume is the desired number of edges in the random graph;
 *  cannot exceed n1*n2
 */
void Rgraph::bigraph(Graph& g, int n1, int n2, int nume) {
	 n1 = max(1,n1); n2 = max(1,n2);
	 nume = min(n1*n2,nume);
	 if (g.n() < n1+n2 || g.M() < nume)
		 g.resize(n1+n2,nume); 
	 else g.clear();
	 addEdges(g,n1,n2,nume);
}

/** Add edges to form a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param nume is the desired number of edges in the graph
 */
void Rgraph::addEdges(Graph& g, int n1, int n2, int nume) {
	 if (nume <= g.m()) return;
	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = g.first(); e != 0; e = g.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(g.left(e), g.right(e));
		 vpair.second = max(g.left(e), g.right(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (g.m() < nume && g.m()/n1 < n2/2) {
		 vertex u = Util::randint(1,n1);
		 vertex v = Util::randint(n1+1,n1+n2);
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); g.join(u,v);
		 }
	 }
	 if (g.m() == nume) {
	 	g.sortAdjLists(); return;
	}

	 // if more edges needed, build a vector containing remaining 
	 // "candidate" edges and then sample from this vector
	 vector<Pair<vertex,vertex>> vpVec;
	 for (vertex u = 1; u <= n1; u++) {
		 for (vertex v = n1+1; v <= n1+n2; v++) {
			 Pair<vertex,vertex> vpair(u,v);
			 if (!edgeSet.contains(vpair)) vpVec.push_back(vpair);
		 }
	 }
	 // sample remaining edges from vector
	 unsigned int i = 0;
	 while (g.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first; vertex v = vpVec[j].second;
		 g.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 g.sortAdjLists();
}

/** Generate a random tree. 
 *  Generates random trees with equal probability assigned to each
 *  labeled tree; method based on Cayley's theorem
 *  @param numv is the number of vertices in the random tree;
 *  if this object has n()>numv, the tree is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 */
void Rgraph::tree(Graph& g, int numv) {
	 // build a random sequence of n-2 vertex numbers
	 // these can be interpreted as "edge endpoints" for
	 // the non-leaf vertices in the tree to be generated;
	 // as we're doing this, compute the vertex degrees
	 vertex endpoints[numv-1]; int d[numv+1];
	 for (int i = 1; i <= numv; i++) d[i] = 1;
	 for (int i = 1; i <= numv-2; i++) {
		 endpoints[i] = Util::randint(1,numv);
		 d[endpoints[i]]++;
	 }
	 // now build a heap containing all leaves in the tree
	 // being generated
	 Dheap<int> degOne(numv,2);      // vertices with one more edge to go
	 for (vertex u = 1; u <= numv; u++) {
		 if (d[u] == 1) degOne.insert(u,u);
	 }
	 // construct tree based on Cayley's theorem
	 for (int i = 1; i <= numv-2; i++) {
		 vertex u = degOne.deletemin();
		 vertex v = endpoints[i];
		 g.join(u,v);
		 if (--d[v] == 1) degOne.insert(v,v);
	 }
	 g.join(degOne.deletemin(),degOne.deletemin());
	 g.sortAdjLists();
}

/** Create a random simple, connected graph.
 *  @param g is an undirected graph object
 *  @param numv is the number of vertices on which the graph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::connected(Graph& g, int numv, int nume) {
	 // try standard random graph generation
	 ugraph(g,numv,nume);

	 if (g.getComponents(NULL) == 1) {
	 	g.sortAdjLists(); return;
	}
	 
	 // graph too sparse for standard method to produce connected graph
	 // so start over, adding edges to a random tree
	 g.clear();
	 tree(g,numv);
	 addEdges(g,nume);
}


/** Create a random simple, regular graph.
 *  @param g is an undirected graph object
 *  @param numv is the number of vertices on which the graph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param d is the number of edges incident to each vertex
 */
void Rgraph::regular(Graph& g, int numv, int d) {
	g.resize(numv, numv*d/2);
	if ((numv & 1) && (d & 1)) 
		Util::fatal("regular graph with odd degree must have even "
			    "number of vertices");
	if (numv <= d)
		Util::fatal("regular graph must have vertex count larger than "
			    "the vertex degree");
	while (!tryRegular(g,numv,d)) {}
}

/** Attempt to create a random simple, regular graph.
 *  @param g is an undirected graph object
 *  @param numv is the number of vertices on which the graph is generated
 *  @param d is the number of edges incident to each vertex
 */
bool Rgraph::tryRegular(Graph& g, int numv, int d) {
	// generate random list of "edge endpoints"
	// endpoints  for vertex v are numbered (v-1)*d...v*d-1
	g.clear();
	int m = numv*d; 
	int ep[m];
	Util::genPerm(m,ep);
	for (int i = 0; i < m-2; i += 2) {
		// select random endpoints from those remaining
		int j = Util::randint(i, m-1);
		int x = ep[j]; ep[j] = ep[i];
		// select another random endpoint to a different vertex
		// note: graph is usually simple, but small chance it's not
		int k; int cnt = 0;
		do {
			k = Util::randint(i+1, m-1);
		} while ((x/d == ep[k]/d || g.findEdge(1+x/d, 1+ep[k]/d))
			  && ++cnt < 2*d);
		int y = ep[k]; ep[k] = ep[i+1];
		if (x/d == y/d) { return false; }
		// join the vertices for the selected endpoints
		g.join(1+x/d, 1+y/d);
	}
	if (ep[m-2]/d == ep[m-1]/d) return false;
	g.join(1+ep[m-2]/d, 1+ep[m-1]/d);
	g.sortAdjLists();
	return true;
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param numv is the number of vertices in each partition of the bigraph;
 *  if this object has n()>2*numv, the random graph is defined over the first
 *  2*numv vertices, leaving the remaining vertices with no edges
 *  @param d is the number of edges incident to each vertex
 */
void Rgraph::regularBigraph(Graph& g, int numv, int d) {
	g.resize(2*numv, numv*d);
	if (numv < d)
		Util::fatal("regular bipartite graph must have vertex count "
			    "at least equal to the vertex degree");
	// generate two random list of "edge endpoints"
	int m = numv*d; 
	int left[m];  Util::genPerm(m,left);
	int right[m]; Util::genPerm(m,right);
	for (int i = 0; i < m-1; i ++) {
		// select random endpoints from those remaining
		int j = Util::randint(i, m-1);
		vertex u = 1 + left[j]%numv; left[j] = left[i];
		// select another random endpoint to a different vertex
		// note: graph is usually simple, but small chance it's not
		int k; int cnt = 0; vertex v;
		do {
			k = Util::randint(i, m-1);
			v = numv + 1 + right[k]%numv;
		} while (g.findEdge(u, v) && ++cnt<2*d);
		// join the vertices for the selected endpoints
		g.join(u,v); right[k] = right[i];
	}
	g.join(1+left[m-1]%numv, numv+1+right[m-1]%numv);
	g.sortAdjLists();
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param n1 is the # of vertices in the "left" partition of the bigraph
 *  @param n2 is the # of vertices in the "right" partition
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1
 *  @param d1 is the degree of the vertices in the "left" partition
 */
void Rgraph::regularBigraph(Graph& g, int n1, int n2, int d1) {
	assert(n1 > 0 && d1 > 0 && n2 >= d1);
	int m = d1*n1;
	g.resize(n1+n2, m);

	// generate two random list of "edge endpoints"
	int left[m];  Util::genPerm(m,left);
	int right[m]; Util::genPerm(m,right);
	for (int i = 0; i < m-1; i ++) {
		// select random endpoints from those remaining
		int j = Util::randint(i, m-1);
		vertex u = 1 + (left[j]%n1); left[j] = left[i];
		// select another random endpoint to a different vertex
		// note: graph is usually simple, but small chance it's not
		int k; int cnt = 0; vertex v;
		do {
			k = Util::randint(i, m-1);
			v = n1 + 1 + (right[k]%n2);
		} while (g.findEdge(u,v) && ++cnt<2*d1);
		// join the vertices for the selected endpoints
		g.join(u,v); right[k] = right[i];
	}
	g.join(1+left[m-1]%n1, n1+1+right[m-1]%n2);
	g.sortAdjLists();
}

/** Create a random regular bipartite multgraph.
 *  @param g is an weighted graph object
 *  @param n1 is the # of vertices in the "left" partition of the bigraph
 *  @param n2 is the # of vertices in the "right" partition
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1
 *  @param d1 is the degree of the vertices in the "left" partition
 */
void Rgraph::regularBiMultigraph(Graph& g, int n1, int n2, int d1) {
	assert(n1 > 0 && d1 > 0 && n2 >= d1);
	int m = d1*n1;
	g.resize(n1+n2, m);

	// generate two random list of "edge endpoints"
	int left[m];  Util::genPerm(m,left);
	int right[m]; Util::genPerm(m,right);
	for (int i = 0; i < m-1; i ++) {
		// select random endpoints from those remaining
		int j = Util::randint(i, m-1);
		vertex u = 1 + (left[j]%n1); left[j] = left[i];
		// select another random endpoint to a different vertex
		// note: graph is need not be simple
		int k = Util::randint(i, m-1);
		vertex v = n1 + 1 + (right[k]%n2);
		// join the vertices for the selected endpoints
		g.join(u,v); right[k] = right[i];
	}
	g.join(1+left[m-1]%n1, n1+1+right[m-1]%n2);
	g.sortAdjLists();
}

/** Create a random bounded-edge-color graph.
 *  @param g is an weighted digraph object
 *  @param n1 is the # of vertices in the "left" partition of the bigraph
 *  @param n2 is the # of vertices in the "right" partition
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1
 *  @param d1 is the degree of the vertices in the "left" partition
 *  @param cmax is an upper bound the colors to be used (0..cmax)
 */
void Rgraph::beColor(Wdigraph& g, int n1, int n2, int d1, int cmax) {
	assert(cmax >= d1 && cmax >= (n2*d1+(n1-1))/n1);
	regularBiMultigraph(g, n1, n2, d1);
	// assign random bounds to edges at each input
	int cvec[cmax];  // vector of colors;
	for (vertex u = 1; u <= g.n(); u++) {
		Util::genPerm(cmax,cvec);
		int i = 0;
		for (edge e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) 
			g.setLength(e,cvec[i++]+1);
	}
}

/** Generate a random digraph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::digraph(Digraph& dg, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (numv > dg.n() || nume > dg.M()) dg.resize(numv,nume); 
	 else dg.clear();

	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = dg.first(); e != 0; e = dg.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(dg.tail(e), dg.head(e));
		 vpair.second = max(dg.tail(e), dg.head(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (dg.m() < nume && dg.m()/numv < numv/2) {
		 vertex u = Util::randint(1,numv);
		 vertex v = Util::randint(1,numv);
		 if (u == v) continue;
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); dg.join(u,v);
		 }
	 }
	 if (dg.m() == nume) {
	 	dg.sortAdjLists(); return;
	}

	 // if more edges needed, build a vector containing remaining 
	 // "candidate" edges and then sample from this vector
	 vector<Pair<vertex,vertex>> vpVec;
	 unsigned int i = 0;
	 for (vertex u = 1; u < numv; u++) {
		 for (vertex v = 1; v <= numv; v++) {
			 if (v == u) continue;
			 Pair<vertex,vertex> vpair(u,v);
			 if (!edgeSet.contains(vpair)) vpVec.push_back(vpair);
		 }
	 }
	 // sample remaining edges from vector
	 i = 0;
	 while (dg.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first; vertex v = vpVec[j].second;
		 dg.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 dg.sortAdjLists();
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
void Rgraph::flograph(Flograph& fg, int numv, int nume, int mss) {
	 mss = max(1,mss); mss = min(mss,(numv-2)/4); 
	 numv = max(numv,3); nume = max(2*mss,nume);

	 if (fg.n() != numv || fg.M() < nume) {
		fg.resize(numv,nume); 
	 } else {
		fg.clear();
	}
	 digraph(fg,numv-2,nume-2*mss);
	 fg.setSrc(numv-1); fg.setSnk(numv);

	 vertex *neighbors = new vertex[2*mss];
	 Util::genPerm(2*mss,neighbors);
	 for (int i = 0; i < mss; i++) {
		 fg.join(fg.src(),neighbors[i]+1);
	 }
	 Util::genPerm(2*mss,neighbors);
	 for (int i = 0; i < mss; i++) {
		 fg.join((numv-2)-(neighbors[i]+1),fg.snk());
	 }
	 fg.sortAdjLists();

	 delete [] neighbors;
}

/** Generate a random directed acyclic graph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::dag(Digraph& g, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (g.n() < numv || g.M() < nume)
		 g.resize(numv,nume); 
	 else g.clear();

	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = g.first(); e != 0; e = g.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(g.tail(e), g.head(e));
		 vpair.second = max(g.tail(e), g.head(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (g.m() < g.M() && g.m()/numv < numv/4) {
		 vertex u = Util::randint(1,numv-1);
		 vertex v = Util::randint(u+1,numv);
		 if (u == v) continue;
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); g.join(u,v);
		 }
	 }
	 if (g.m() == g.M()) {
	 	g.sortAdjLists(); return;
	}

	 // if more edges needed, build a vector containing remaining 
	 // "candidate" edges and then sample from this vector
	 vector<Pair<vertex,vertex>> vpVec;
	 for (vertex u = 1; u < numv; u++) {
		 for (vertex v = u+1; v <= numv; v++) {
			 if (v == u) continue;
			 Pair<vertex,vertex> vpair(u,v);
			 if (!edgeSet.contains(vpair)) vpVec.push_back(vpair);
		 }
	 }
	 // sample remaining edges from vector
	 int i = 0;
	 while (g.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first; vertex v = vpVec[j].second;
		 g.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 g.sortAdjLists();
}

/** Generate a random group graph
 *  @param n1 is the number of input vertices
 *  @param n2 is the number of output vertices
 *  @param gc1 is the maximum group count of the input vertices
 *  @param d2 is the degree of the input vertices
 *  @param k is an upper bound on the number of colors needed to
 *  color the graph; must be at least as big as gc1 and d2
 */
void Rgraph::groupGraph(GroupGraph& g, int n1, int n2, int gc1, int d2, int k) {
	int d1 = n2*d2/n1;
	assert(gc1 <= d1 && gc1 <= k && d2 <= k && d2 <= n1 &&
		d1 <= n2 && d1*n1 == d2*n2);
	regularBigraph(g, n1, n2, d1);

	// assign colors to the edges
	int color[g.m()]; int cvec[k];
	for (vertex v = g.firstOut(); v != 0; v = g.nextOut(v)) {
		Util::genPerm(k,cvec); 
		int i = 0;
		for (edge e = g.firstAt(v); e != 0; e = g.nextAt(v,e)) {
			int j = Util::randint(i,k-1);
			color[e] = cvec[j]; cvec[j] = cvec[i++];
		}
	}

	// assign groups at inputs that are consistent with colors
	int evec[k];
	for (vertex u = g.firstIn(); u != 0; u = g.nextIn(u)) {
		std::fill(evec, evec+k, 0);
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			int c = color[e];
			if (evec[c] == 0) evec[c] = e;
			else g.merge(e,evec[c]);
		}
	}

	// merge groups at inputs so as to satisfy maximum group count
	int gvec[g.M()];
	for (vertex u = g.firstIn(); u != 0; u = g.nextIn(u)) {
		int i = 0;
		for (int grp = g.firstGroup(u); grp != 0;
			 grp = g.nextGroup(u,grp))
			gvec[i++] = grp;
		i--;
		while (i >= gc1) {
			int j = Util::randint(0,i);
			edge e1 = g.firstEdgeInGroup(gvec[j]);
			gvec[j] = gvec[i--];
			j = Util::randint(0,i);
			edge e2 = g.firstEdgeInGroup(gvec[j]);
			gvec[j] = gvec[i];
			gvec[i] = g.merge(e1, e2);
		}
	}
}

/** Assign random weights to edges in a graph.
 *  @param g is a reference to the target Wgraph
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Rgraph::setWeights(Wgraph& g, int lo, int hi) {
	 for (edge e = g.first(); e != 0; e = g.next(e))
		 g.setWeight(e,Util::randint(lo,hi));
}

/** Assign random lengths to edges in a graph.
 *  @param dg is a reference to the target Wdigraph
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Rgraph::setLengths(Wdigraph& dg, int lo, int hi) {
	 for (edge e = dg.first(); e != 0; e = dg.next(e))
		 dg.setLength(e,Util::randint(lo,hi));
}

/** Assign random edge capacities to edges in a Flograph.
 *  @param fg is a reference to the target Flograph.
 *  @param ec1 is the max capacity of the source/sink edges
 *  @param ec2 is the max capacity of the remaining edges
 *  edge capacities are selected uniformly with a minimum of 1
 */
void Rgraph::setCapacities(Flograph& fg, flow ec1, flow ec2) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		 if (fg.tail(e) == fg.src() || fg.head(e) == fg.snk())
			 fg.setCapacity(e,Util::randint(1,ec1));
		 else
			 fg.setCapacity(e,Util::randint(1,ec2));
	 }
}

/** Generate random costs to edges in a weighted flograph.
 *  @param fg is a reference to the target Wflograph
 *  @param lo is the low end of the range of costs
 *  @param hi is the high end of the range of costs
 *  costs are generated uniformly in [lo,hi]
 */
void Rgraph::setCosts(Wflograph& fg, floCost lo, floCost hi) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e))
		 fg.setCost(e,Util::randint(lo,hi));
}

/** Generate random min flow requirements.
 *  @param lo is the low end of the range of min flows
 *  @param hi is the high end of the range of min flows
 *  min flows are generated uniformly in [lo,hi]
 */
void Rgraph::setMinFlows(Mflograph& fg, flow lo, flow hi) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e))
		 fg.setMinFlo(e,Util::randint(lo,hi));
}

/** Shuffle the vertices and edges according to the given permutations.
 *  @param g is a graph object to be shuffled
 *  @param vp is a permutation on the vertices,
 *  mapping vertex u to vp[u]
 *  @param ep is a permutation on the edges,
 *  mapping edge e to ep[e]
 */
void Rgraph::shuffle(Graph& g, int vp[], int ep[]) {
	 vertex left[g.M()+1]; vertex right[g.M()+1];

	 for (edge e = 1; e <= g.M(); e++) {
		 if (g.validEdge(e)) {
			 left[e] = g.left(e); right[e] = g.right(e);
		 } else  left[e] = 0;
	 }
	 g.clear();
	 for (edge e = 1; e <= g.M(); e++) {
		 if (left[e] != 0)
			 g.joinWith( 1+vp[left[e]-1],
					1+vp[right[e]-1],
					1+ep[e-1]);
	 }
}

void Rgraph::shuffle(Wgraph& g, int vp[], int ep[]) {
	shuffle((Graph&) g,vp,ep);
	Util::shuffle<edgeWeight>(g.wt+1, ep, g.M());
}

void Rgraph::shuffle(Wdigraph& g, int vp[], int ep[]) {
	shuffle((Digraph&) g,vp,ep);
	Util::shuffle<edgeLength>(g.len+1,ep,g.M());
}
	
void Rgraph::shuffle(Flograph& g, int vp[], int ep[]) {
	shuffle((Graph&) g,vp,ep);
	Util::shuffle<Flograph::FloInfo>(g.floInfo+1, ep, g.M());
	g.setSrc(1+vp[g.src()-1]); g.setSnk(1+vp[g.snk()-1]);
}

void Rgraph::shuffle(Wflograph& g, int vp[], int ep[]) {
	shuffle((Flograph&) g,vp,ep);
	Util::shuffle<flow>(g.cst+1, ep, g.M());
}

void Rgraph::shuffle(Mflograph& g, int vp[], int ep[]) {
	shuffle((Flograph&) g,vp,ep);
	Util::shuffle<flow>(g.mflo+1, ep, g.M());
}

void Rgraph::shuffle(GroupGraph& g, int vp[], int ep[]) {
	GroupGraph gg(g.n(), g.M());
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.input(e); vertex v = g.output(e);
		gg.joinWith(vp[u-1]+1, vp[v-1]+1,
			    ep[g.groupNumber(e)-1]+1, ep[e-1]+1);
	}
	g.copyFrom(gg);
}

} // ends namespace
