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
#include "ecolor_g.h"

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

bool rgraphSortVpairs(Pair<vertex,vertex> x, Pair<vertex,vertex> y) {
	return (x.first < y.first || (x.first == y.first && x.second < y.second));
}

/** Add random edges to yield a random simple graph.
 *  @param nume is the target number of edges; if the graph already
 *  has some edges, they are assumed to all be unique; additional edges
 *  will be added until the graph has nume edges
 */
void Rgraph::addEdges(Graph& g, int nume) {
	if (nume <= g.m()) return;
	if (nume + g.m() > g.n()*(g.n()-1)/2)
		Util::fatal("Rgraph::addEdges: too many edges");
	Pair<vertex, vertex> *pvec; int pvsiz;
	if (nume/g.n() > g.n()/8) { // dense graphs
		// build complete vector of candidate edges
		pvsiz = g.n()*(g.n()-1)/2;
		pvec = new Pair<vertex,vertex>[pvsiz];
		int i = 0;
		for (vertex u = 1; u < g.n(); u++) {
			for (vertex v = u+1; v <= g.n(); v++) {
				pvec[i].first = u; pvec[i].second = v; i++;
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pvsiz = nume + max(nume, 1000);
		pvec = new Pair<vertex,vertex>[pvsiz];
		for (int i = 0; i < pvsiz; i++) {
			pvec[i].first = Util::randint(1,g.n()-1);
			pvec[i].second = Util::randint(pvec[i].first+1,g.n());
		}
		// sort pairs and remove duplicates
		std::sort(pvec, pvec+pvsiz, rgraphSortVpairs);
		int i = 0; int j = 0;
		while (++j < pvsiz) {
			if (pvec[j] != pvec[i]) pvec[++i] = pvec[j];
		}
		pvsiz = i+1;
		if (pvsiz < nume - g.m())
			Util::fatal("Rgraph::addEdges: program error, too few "
			      "candidate edges");
	}

	// mark current edges in list of pairs
	int cp = 0; List nbors(g.n());
	for (vertex u = 1; u <= g.n(); u++) {
		if (u < pvec[cp].first) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			nbors.addLast(g.mate(u,e));
		while (pvec[cp].first == u) {
			if (nbors.member(pvec[cp].second)) pvec[cp].first = 0;
			cp++;
		}
		nbors.clear();
	}
	// remove current edges from pvec
	int i = 0;
	while (i < pvsiz && pvec[i].first != 0) i++;
	int j = i;
	while (++j < pvsiz) {
		if (pvec[j].first != 0) {
			pvec[i++] = pvec[j]; pvec[j].first = 0;
		}
	}
	pvsiz = i;

	// sample from remaining pairs
	int k = pvsiz-1;
	while (g.m() < nume) {
		int i = Util::randint(0,k);
		g.join(pvec[i].first, pvec[i].second);
		pvec[i] = pvec[k--];
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
	if (nume + g.m() > n1*n2)
		Util::fatal("Rgraph::addEdges: too many edges");
	if (n1+n2 > g.n())
		Util::fatal("Rgraph::addEdges: too few vertices");
	Pair<vertex, vertex> *pvec; int pvsiz;
	if (nume/n1 > n2/4) { // dense graphs
		// build complete vector of candidate edges
		pvsiz = n1*n2;
		pvec = new Pair<vertex,vertex>[pvsiz];
		int i = 0;
		for (vertex u = 1; u < n1; u++) {
			for (vertex v = n1+1; v <= n1+n2; v++) {
				pvec[i].first = u; pvec[i].second = v; i++;
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pvsiz = nume + max(nume, 1000);
		pvec = new Pair<vertex,vertex>[pvsiz];
		for (int i = 0; i < pvsiz; i++) {
			pvec[i].first = Util::randint(1,n1);
			pvec[i].second = Util::randint(n1+1,n1+n2);
		}
		// sort pairs and remove duplicates
		std::sort(pvec, pvec+pvsiz, rgraphSortVpairs);
		int i = 0; int j = 0;
		while (++j < pvsiz) {
			if (pvec[j] != pvec[i]) pvec[++i] = pvec[j];
		}
		pvsiz = i+1;
		if (pvsiz < nume - g.m())
			Util::fatal("Rgraph::addEdges: program error, too few "
			      "candidate edges");
	}

	// mark current edges in list of pairs
	int cp = 0; List nbors(g.n());
	for (vertex u = 1; u <= g.n(); u++) {
		if (u < pvec[cp].first) continue;
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			nbors.addLast(g.mate(u,e));
		while (pvec[cp].first == u) {
			if (nbors.member(pvec[cp].second)) pvec[cp].first = 0;
			cp++;
		}
		nbors.clear();
	}
	// remove current edges from pvec
	int i = 0;
	while (i < pvsiz && pvec[i].first != 0) i++;
	int j = i;
	while (++j < pvsiz) {
		if (pvec[j].first != 0) {
			pvec[i++] = pvec[j]; pvec[j].first = 0;
		}
	}
	pvsiz = i;

	// sample from remaining pairs
	int k = pvsiz-1;
	while (g.m() < nume) {
		int i = Util::randint(0,k);
		g.join(pvec[i].first, pvec[i].second);
		pvec[i] = pvec[k--];
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
	 Heap_d<int> degOne(numv,2);      // vertices with one more edge to go
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
	regularBigraph(g, numv, numv, d);
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
		// note: graph need not be simple
		int k = Util::randint(i, m-1);
		vertex v = n1 + 1 + (right[k]%n2); right[k] = right[i];
		// join the vertices for the selected endpoints
		g.join(u,v);
	}
	g.join(1+left[m-1]%n1, n1+1+right[m-1]%n2);
	g.sortAdjLists();
}

/** Create a random bounded-edge-color graph.
 *  @param g is an weighted digraph object
 *  @param n1 is the # of vertices in the "left" partition of the bigraph
 *  @param n2 is the # of vertices in the "right" partition
 *  @param d1 is the degree of the vertices in the "left" partition
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all;
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1
 *  @param bmax is an upper bound on the bounds (1..bmax)
 *  @param p is probability used to control selection of bounds
 */
void Rgraph::becolor(Graph_wd& g, int n1, int n2, int d1, int bmax, double p) {
	int d2 = (n2*d1+(n1-1))/n1;
	assert(bmax >= d1 && bmax >= d2);
	regularBiMultigraph(g, n1, n2, d1);
	// assign random bounds to edges at each input
	int bvec[bmax];  // vector of colors;
	for (vertex u = 1; u <= g.n(); u++) {
		Util::genPerm(bmax,bvec);
		int i = 0;
		for (edge e = g.firstOut(u); e != 0; e = g.nextOut(u,e)) 
			g.setLength(e,bvec[i++]+1);
	}
}

/** Generate a random digraph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::digraph(Graph_d& dg, int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume); nume = min(nume,numv*(numv-1));
	if (numv > dg.n() || nume > dg.M()) dg.resize(numv,nume); 
	else dg.clear();

	Pair<vertex, vertex> *pvec; int pvsiz;
	if (nume/numv > numv/4) { // dense graphs
		// build complete vector of candidate edges
		pvsiz = numv*(numv-1);
		pvec = new Pair<vertex,vertex>[pvsiz];
		int i = 0;
		for (vertex u = 1; u <= numv; u++) {
			for (vertex v = 1; v <= numv; v++) {
				if (v == u) continue;
				pvec[i].first = u; pvec[i].second = v; i++;
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pvsiz = nume + max(nume, 1000);
		pvec = new Pair<vertex,vertex>[pvsiz];
		for (int i = 0; i < pvsiz; i++) {
			pvec[i].first = Util::randint(1,dg.n());
			pvec[i].second = Util::randint(1,dg.n()-1);
			if (pvec[i].second >= pvec[i].first)
				pvec[i].second++;
		}
		// sort pairs and remove duplicates
		std::sort(pvec, pvec+pvsiz, rgraphSortVpairs);
		int i = 0; int j = 0;
		while (++j < pvsiz) {
			if (pvec[j] != pvec[i]) pvec[++i] = pvec[j];
		}
		pvsiz = i+1;
		if (pvsiz < nume)
			Util::fatal("Rgraph::digraph: program error, too few "
			      "candidate edges");
	}
	// sample from pvec
	int k = pvsiz-1;
	while (dg.m() < nume) {
		int i = Util::randint(0,k);
		dg.join(pvec[i].first, pvec[i].second);
		pvec[i] = pvec[k--];
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
 *  Graph_d::rgraph. The source and sink are then added to the core.
 *  If mss>(numv-2)/4, it is first reduced to (numv-2)/4.
 */
void Rgraph::flograph(Graph_f& fg, int numv, int nume, int mss) {
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
void Rgraph::dag(Graph_d& g, int numv, int nume) {
	numv = max(0,numv); nume = max(0,nume);
	if (g.n() < numv || g.M() < nume)
		g.resize(numv,nume); 
	else g.clear();

	Pair<vertex, vertex> *pvec; int pvsiz;
	if (nume/numv > numv/8) { // dense graphs
		// build complete vector of candidate edges
		pvsiz = numv*(numv-1)/2;
		pvec = new Pair<vertex,vertex>[pvsiz];
		int i = 0;
		for (vertex u = 1; u <= numv; u++) {
			for (vertex v = u+1; v <= numv; v++) {
				pvec[i].first = u; pvec[i].second = v; i++;
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pvsiz = nume + max(nume, 1000);
		pvec = new Pair<vertex,vertex>[pvsiz];
		for (int i = 0; i < pvsiz; i++) {
			pvec[i].first = Util::randint(1,g.n()-1);
			pvec[i].second = Util::randint(pvec[i].first+1,g.n());
		}
		// sort pairs and remove duplicates
		std::sort(pvec, pvec+pvsiz, rgraphSortVpairs);
		int i = 0; int j = 0;
		while (++j < pvsiz) {
			if (pvec[j] != pvec[i]) pvec[++i] = pvec[j];
		}
		pvsiz = i+1;
		if (pvsiz < nume)
			Util::fatal("Rgraph::dag: program error, too few "
			      "candidate edges");
	}
	// sample from pvec
	int k = pvsiz-1;
	while (g.m() < nume) {
		int i = Util::randint(0,k);
		g.join(pvec[i].first, pvec[i].second);
		pvec[i] = pvec[k--];
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
void Rgraph::groupGraph(Graph_g& g, int n1, int n2, int gc1, int d2, int k) {
	int d1 = n2*d2/n1;
	assert(gc1 <= d1 && gc1 <= k && d2 <= k && d2 <= n1 &&
		d1 <= n2 && d1*n1 == d2*n2);
	regularBigraph(g, n1, n2, d1);

	// assign colors to the edges
	int color[g.M()+1]; int cvec[k];
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
			int c = color[e]; evec[c] = g.merge(evec[c],e);
		}
	}

	// merge groups at inputs so as to satisfy maximum group count
	int gvec[gc1];
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
 *  @param g is a reference to the target Graph_w
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Rgraph::setWeights(Graph_w& g, int lo, int hi) {
	 for (edge e = g.first(); e != 0; e = g.next(e))
		 g.setWeight(e,Util::randint(lo,hi));
}

/** Assign random lengths to edges in a graph.
 *  @param dg is a reference to the target Graph_wd
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Rgraph::setLengths(Graph_wd& dg, int lo, int hi) {
	 for (edge e = dg.first(); e != 0; e = dg.next(e))
		 dg.setLength(e,Util::randint(lo,hi));
}

/** Assign random edge capacities to edges in a Graph_f.
 *  @param fg is a reference to the target Graph_f.
 *  @param ec1 is the max capacity of the source/sink edges
 *  @param ec2 is the max capacity of the remaining edges
 *  edge capacities are selected uniformly with a minimum of 1
 */
void Rgraph::setCapacities(Graph_f& fg, flow ec1, flow ec2) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		 if (fg.tail(e) == fg.src() || fg.head(e) == fg.snk())
			 fg.setCapacity(e,Util::randint(1,ec1));
		 else
			 fg.setCapacity(e,Util::randint(1,ec2));
	 }
}

/** Generate random costs to edges in a weighted flograph.
 *  @param fg is a reference to the target Graph_wf
 *  @param lo is the low end of the range of costs
 *  @param hi is the high end of the range of costs
 *  costs are generated uniformly in [lo,hi]
 */
void Rgraph::setCosts(Graph_wf& fg, floCost lo, floCost hi) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e))
		 fg.setCost(e,Util::randint(lo,hi));
}

/** Generate random min flow requirements.
 *  @param lo is the low end of the range of min flows
 *  @param hi is the high end of the range of min flows
 *  min flows are generated uniformly in [lo,hi]
 */
void Rgraph::setMinFlows(Graph_ff& fg, flow lo, flow hi) {
	 for (edge e = fg.first(); e != 0; e = fg.next(e))
		 fg.setFloor(e,Util::randint(lo,hi));
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

void Rgraph::shuffle(Graph_w& g, int vp[], int ep[]) {
	shuffle((Graph&) g,vp,ep);
	Util::shuffle<edgeWeight>(g.wt+1, ep, g.M());
}

void Rgraph::shuffle(Graph_wd& g, int vp[], int ep[]) {
	shuffle((Graph_d&) g,vp,ep);
	Util::shuffle<edgeLength>(g.len+1,ep,g.M());
}
	
void Rgraph::shuffle(Graph_f& g, int vp[], int ep[]) {
	shuffle((Graph&) g,vp,ep);
	Util::shuffle<Graph_f::FloInfo>(g.floInfo+1, ep, g.M());
	g.setSrc(1+vp[g.src()-1]); g.setSnk(1+vp[g.snk()-1]);
}

void Rgraph::shuffle(Graph_wf& g, int vp[], int ep[]) {
	shuffle((Graph_f&) g,vp,ep);
	Util::shuffle<flow>(g.cst+1, ep, g.M());
}

void Rgraph::shuffle(Graph_ff& g, int vp[], int ep[]) {
	shuffle((Graph_f&) g,vp,ep);
	Util::shuffle<flow>(g.flor+1, ep, g.M());
}

void Rgraph::shuffle(Graph_g& g, int vp[], int ep[]) {
	Graph_g gg(g.n(), g.M());
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		vertex u = g.input(e); vertex v = g.output(e);
		gg.joinWith(vp[u-1]+1, vp[v-1]+1,
			    ep[g.groupNumber(e)-1]+1, ep[e-1]+1);
	}
	g.copyFrom(gg);
}

} // ends namespace
