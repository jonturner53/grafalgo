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
void Rgraph::ugraph(Graph& graf, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (numv > graf.n() || nume > graf.maxEdgeNum())
		 graf.resize(numv,nume);
	 else graf.clear();
	 addEdges(graf,nume);
}

/** Add random edges to a graph.
 *  @param nume is the target number of edges; if the graph already
 *  has some edges, additional edges will be added until the
 *  graph has nume edges
 */
void Rgraph::addEdges(Graph& graf, int nume) {
	 if (nume <= graf.m()) return;
	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = graf.first(); e != 0; e = graf.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(graf.left(e), graf.right(e));
		 vpair.second = max(graf.left(e), graf.right(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (graf.m() < nume && graf.m()/graf.n() < graf.n()/4) {
		 vertex u = Util::randint(1,graf.n());
		 vertex v = Util::randint(1,graf.n());
		 if (u == v) continue;
		 if (u > v) { vertex w = u; u = v; v = w; }
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); graf.join(u,v);
		 }
	 }
	 if (graf.m() == nume) {
	 	graf.sortAdjLists(); return;
	}

	 // if more edges needed, build a vector containing remaining 
	 // "candidate" edges and then sample from this vector
	 vector<Pair<vertex,vertex>> vpVec;
	 for (vertex u = 1; u < graf.n(); u++) {
		 for (vertex v = u+1; v <= graf.n(); v++) {
			 Pair<vertex,vertex> vpair(u,v);
			 if (!edgeSet.contains(vpair)) vpVec.push_back(vpair);
		 }
	 }
	 // sample remaining edges from vector
	 unsigned int i = 0;
	 while (graf.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first;
		 vertex v = vpVec[j].second;
		 graf.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 graf.sortAdjLists();
}

/** Generate a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param nume is the desired number of edges in the random graph;
 *  cannot exceed n1*n2
 */
void Rgraph::bigraph(Graph& graf, int n1, int n2, int nume) {
	 n1 = max(1,n1); n2 = max(1,n2);
	 nume = min(n1*n2,nume);
	 if (graf.n() < n1+n2 || graf.maxEdgeNum() < nume)
		 graf.resize(n1+n2,nume); 
	 else graf.clear();
	 addEdges(graf,n1,n2,nume);
}

/** Add edges to form a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param nume is the desired number of edges in the graph
 */
void Rgraph::addEdges(Graph& graf, int n1, int n2, int nume) {
	 if (nume <= graf.m()) return;
	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = graf.first(); e != 0; e = graf.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(graf.left(e), graf.right(e));
		 vpair.second = max(graf.left(e), graf.right(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (graf.m() < nume && graf.m()/n1 < n2/2) {
		 vertex u = Util::randint(1,n1);
		 vertex v = Util::randint(n1+1,n1+n2);
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); graf.join(u,v);
		 }
	 }
	 if (graf.m() == nume) {
	 	graf.sortAdjLists(); return;
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
	 while (graf.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first; vertex v = vpVec[j].second;
		 graf.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 graf.sortAdjLists();
}

/** Generate a random tree. 
 *  Generates random trees with equal probability assigned to each
 *  labeled tree; method based on Cayley's theorem
 *  @param numv is the number of vertices in the random tree;
 *  if this object has n()>numv, the tree is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 */
void Rgraph::tree(Graph& graf, int numv) {
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
		 graf.join(u,v);
		 if (--d[v] == 1) degOne.insert(v,v);
	 }
	 graf.join(degOne.deletemin(),degOne.deletemin());
	 graf.sortAdjLists();
}

/** Create a random simple, connected graph.
 *  @param graf is an undirected graph object
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::connected(Graph& graf, int numv, int nume) {
	 // try standard random graph generation
	 ugraph(graf,numv,nume);

	 if (graf.getComponents(NULL) == 1) {
	 	graf.sortAdjLists(); return;
	}
	 
	 // graph too sparse for standard method to produce connected graph
	 // so start over, adding edges to a random tree
	 graf.clear();
	 tree(graf,numv);
	 addEdges(graf,nume);
}

void Rgraph::regular(Graph& graf, int numv, int d) {
	graf.resize(numv, numv*d/2);
	if ((numv & 1) && (d & 1)) 
		Util::fatal("regular graph with odd degree must have even "
			    "number of vertices");
	if (numv <= d)
		Util::fatal("regular graph must have vertex count larger than "
			    "the vertex degree");
	while (!tryRegular(graf,numv,d)) {}
}

bool Rgraph::tryRegular(Graph& graf, int numv, int d) {
	// generate random list of "edge endpoints"
	// endpoints  for vertex v are numbered (v-1)*d...v*d-1
	graf.clear();
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
		} while ((x/d == ep[k]/d || graf.findEdge(1+x/d, 1+ep[k]/d))
			  && ++cnt < 2*d);
		int y = ep[k]; ep[k] = ep[i+1];
		if (x/d == y/d) { return false; }
		// join the vertices for the selected endpoints
		graf.join(1+x/d, 1+y/d);
	}
	if (ep[m-2]/d == ep[m-1]/d) return false;
	graf.join(1+ep[m-2]/d, 1+ep[m-1]/d);
	graf.sortAdjLists();
	return true;
}

void Rgraph::regularBigraph(Graph& graf, int numv, int d) {
	graf.resize(2*numv, numv*d);
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
		int x = left[j]; left[j] = left[i];
		// select another random endpoint to a different vertex
		// note: graph is usually simple, but small chance it's not
		int k; int cnt = 0;
		do {
			k = Util::randint(i, m-1);
		} while (graf.findEdge(1+x/d, numv+1+right[k]/d) && ++cnt<2*d);
		int y = right[k]; right[k] = right[i];
		// join the vertices for the selected endpoints
		graf.join(1+x/d, numv+1+y/d);
	}
	graf.join(1+left[m-1]/d, numv+1+right[m-1]/d);
	graf.sortAdjLists();
}

/** Generate a random digraph.
 *  @param numv is the number of vertices on which the digraph is generated;
 *  if this object has n()>numv, the random graph is defined over the first
 *  numv vertices, leaving the remaining vertices with no edges
 *  @param nume is the number of edges in the generated digraph
 */
void Rgraph::digraph(Digraph& dg, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (numv > dg.n() || nume > dg.maxEdgeNum()) dg.resize(numv,nume); 
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

	 if (fg.n() != numv || fg.maxEdgeNum() < nume) {
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
void Rgraph::dag(Digraph& dgraf, int numv, int nume) {
	 numv = max(0,numv); nume = max(0,nume);
	 if (dgraf.n() < numv || dgraf.maxEdgeNum() < nume)
		 dgraf.resize(numv,nume); 
	 else dgraf.clear();

	 // build set containing edges already in graph
	 HashSet<Pair<vertex,vertex>,Hash::s32s32> edgeSet(nume);
	 for (edge e = dgraf.first(); e != 0; e = dgraf.next(e)) {
		 Pair<vertex,vertex> vpair;
		 vpair.first =  min(dgraf.tail(e), dgraf.head(e));
		 vpair.second = max(dgraf.tail(e), dgraf.head(e));
		 edgeSet.insert(vpair);
	 }

	 // add edges using random sampling of vertex pairs
	 // stop early if graph gets so dense that most samples
	 // repeat edges already in graph
	 while (dgraf.m() < dgraf.maxEdgeNum() && dgraf.m()/numv < numv/4) {
		 vertex u = Util::randint(1,numv-1);
		 vertex v = Util::randint(u+1,numv);
		 if (u == v) continue;
		 Pair<vertex,vertex> vpair(u,v);
		 if (!edgeSet.contains(vpair)) {
			 edgeSet.insert(vpair); dgraf.join(u,v);
		 }
	 }
	 if (dgraf.m() == dgraf.maxEdgeNum()) {
	 	dgraf.sortAdjLists(); return;
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
	 while (dgraf.m() < nume && i < vpVec.size()) {
		 int j = Util::randint(i,vpVec.size()-1);
		 vertex u = vpVec[j].first; vertex v = vpVec[j].second;
		 dgraf.join(u,v); vpVec[j] = vpVec[i++];
	 }
	 dgraf.sortAdjLists();
}

/** Assign random weights to edges in a graph.
 *  @param graf is a reference to the target Wgraph
 *  @param lo is the low end of the range
 *  @param hi is the high end of the range
 */
void Rgraph::setWeights(Wgraph& graf, int lo, int hi) {
	 for (edge e = graf.first(); e != 0; e = graf.next(e))
		 graf.setWeight(e,Util::randint(lo,hi));
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
 *  @param graf is a graph object to be shuffled
 *  @param vp is a permutation on the vertices (size n()+1),
 *  mapping vertex u to vp[u]
 *  @param ep is a permutation on the edges (size maxEdgeNum()+1),
 *  mapping edge e to ep[e]
 */
void Rgraph::shuffle(Graph& graf, int vp[], int ep[]) {
	 vertex left[graf.maxEdgeNum()+1];
	 vertex right[graf.maxEdgeNum()+1];

	 for (edge e = 1; e <= graf.maxEdgeNum(); e++) {
		 if (graf.validEdge(e)) {
			 left[e] = graf.left(e); right[e] = graf.right(e);
		 } else  left[e] = 0;
	 }
	 graf.clear();
	 for (edge e = 1; e <= graf.maxEdgeNum(); e++) {
		 if (left[e] != 0)
			 graf.joinWith( 1+vp[left[e]-1],
					1+vp[right[e]-1],
					1+ep[e-1]);
	 }
}

void Rgraph::shuffle(Wgraph& graf, int vp[], int ep[]) {
	shuffle((Graph&) graf,vp,ep);
	Util::shuffle<edgeWeight>(graf.wt, ep, graf.maxEdgeNum());
}

void Rgraph::shuffle(Wdigraph& graf, int vp[], int ep[]) {
	shuffle((Digraph&) graf,vp,ep);
	Util::shuffle<edgeLength>(graf.len,ep,graf.maxEdgeNum());
}
	
void Rgraph::shuffle(Flograph& graf, int vp[], int ep[]) {
	shuffle((Graph&) graf,vp,ep);
	Util::shuffle<Flograph::FloInfo>(graf.floInfo, ep, graf.maxEdgeNum());
	graf.setSrc(vp[graf.src()]); graf.setSnk(vp[graf.snk()]);
}

void Rgraph::shuffle(Wflograph& graf, int vp[], int ep[]) {
	shuffle((Flograph&) graf,vp,ep);
	Util::shuffle<flow>(graf.cst, ep, graf.maxEdgeNum());
}

void Rgraph::shuffle(Mflograph& graf, int vp[], int ep[]) {
	shuffle((Flograph&) graf,vp,ep);
	Util::shuffle<flow>(graf.mflo, ep, graf.maxEdgeNum());
}

} // ends namespace
