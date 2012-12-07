/** @file Graph.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.graphs;

import java.io.*;
import java.util.Vector;
import algoLib.misc.Util;
import algoLib.dataStructures.basic.List;
import algoLib.dataStructures.basic.Clist;
import algoLib.dataStructures.basic.SetPair;
import algoLib.dataStructures.heaps.Dheap;

/** Data structure for undirected graph.
 *
 *  Graph size (number of vertices and max number of edges) must
 *  be specified when a Graph object is instantiated.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
public class Graph {
	protected int N;		///< number of vertices 
	protected int M;		///< number of edges
	protected int maxEdge;		///< max number of edges

	private int[] fe;		///< fe[v] is first int incident to v

	private class EdgeInfo {
	int	l;			///< l is left endpoint of int
	int	r;			///< r is right endpoint of int
	};
	EdgeInfo[] evec;		///< array of int structures
	private SetPair edges;	///< sets of in-use and free edges
	private Clist adjLists;	///< collection of int adjacency lists
					///< stores int e as both 2e and 2e+1

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param N1 is number of vertices in the graph
	 *  @param maxEdge1 is the maximum number of edges
	 */
	public Graph(int N, int maxEdge) {
		this.N = N; this.maxEdge = maxEdge; M = 0;
		makeSpace(N,maxEdge);
	}

	private void makeSpace(int numv, int maxe) {
		fe = new int[numv+1];
		evec = new EdgeInfo[maxe+1];
		edges = new SetPair(maxe);
		adjLists = new Clist(2*maxe+1);
		for (int u = 1; u <= numv; u++) fe[u] = 0;
		for (int e = 0; e <= maxEdge; e++) {
			evec[e] = new EdgeInfo();
			evec[e].l = evec[e].r = 0;
		}
	}

	/** Resize the dynamic storage for a graph, discarding old contents.
	 *  @param numv is the number of vertices to allocate space for
	 *  @param maxe is the number of edges to allocate space for
	 */
	protected void resize(int numv, int maxe) {
		N = numv; maxEdge = maxe; M = 0;
		makeSpace(numv, maxe);
	}
	
	/** Remove/initialize all the edges from a graph.  */
	public void reset() {
		adjLists.reset(); edges.reset();
		for (int u = 1; u <= n(); u++) fe[u] = 0;
		M = 0;
	}

	/** Copy another Graph to this one.
	 *  @param original is another graph that is to replace this one.
	 */
	public void copyFrom(Graph original) {
		if (N != original.n() || maxEdge < original.m()) {
			resize(original.n(), original.m());
		} else {
			reset();
		}
		N = original.n();
		for (int e = original.first(); e != 0; e = original.next(e)) {
			join(original.left(e),original.right(e));
		}
		sortAdjLists();
	}

	/** Get the number of vertices.
	 *  @return the number of vertices in the graph.
	 */
	public int n() { return N; }
	
	/** Get the number of edges.
	 *  @return the number of edges in the graph.
	 */
	public int m() { return M; }
	
	/** Determine if an edge number corresponds to a valid edge.
	 *  @param e is the int number to be verified
	 *  @return true if e is a valid int number, else false.
	 */
	public boolean validEdge(int e) { return edges.isIn(e); }
	
	/** Get the first edge in the overall list of edges.
	 *  @return the first edge in the list
	 */
	public int first() { return edges.firstIn(); }
	
	/** Get the next edge in the overall list of edges.
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the list, or 0 if e is not in the list
	 *  or it has no successor
	 */
	public int next(int e) { return edges.nextIn(e); }
	
	/** Get the first edge incident to a vertex.
	 *  @param v is the vertex of interest
	 *  @return the first edge incident to v
	 */
	public int firstAt(int v) { 
		assert(1 <= v && v <= N); return fe[v]/2;
	}
	
	/** Get the next edge in the adjacency list for a specific vertex.
	 *  @param v is the vertex whose adjacency list we're accessing
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the adjacency list for v
	 *  or 0 if e is not incident to v or is the last edge on the list
	 */
	public int nextAt(int v, int e) {
		assert(1 <= v && v <= N && 1 <= e && e <= maxEdge);
		if (v != evec[e].l && v != evec[e].r) return 0;
		int ee = (v == evec[e].l ? 2*e : 2*e+1);
		int ff = adjLists.suc(ee);
		return (fe[v] == ff ? 0 : ff/2);
	}
	
	/** Get the left endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the left endpoint of e, or 0 if e is not a valid edge.
	 */
	public int left(int e) {
		assert(0 <= e && e <= maxEdge);
		return evec[e].l;
	}
	
	/** Get the right endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the right endpoint of e, or 0 if e is not a valid edge.
	 */
	public int right(int e) {
		assert(0 <= e && e <= maxEdge);
		return (evec[e].l == 0 ? 0 : evec[e].r);
	}
	
	/** Get the other endpoint of an edge.
	 *  @param v is a vertex
	 *  @param e is an edge incident to v
	 *  @return the other vertex incident to e, or 0 if e is not 
	 *  a valid edge or it is not incident to v.
	 */
	// Return other endpoint of e.
	public int mate(int v, int e) {
		assert(1 <= v && v <= N && 1 <= e && e <= maxEdge);
		return (evec[e].l == 0 ?
			0 : (v == evec[e].l ?
			     evec[e].r : (v == evec[e].r ? evec[e].l : 0)));
	}

	public int join(int u, int v) {
		int e = edges.firstOut(); return joinWith(u,v,e);
	}

	/** Join two vertices with a specific edge.
	 *  @param u is the left endpoint for the new edge
	 *  @param v is the right endpoint for the new edge
	 *  @param e is the number of an idle edge
	 *  @return the edge number for the new edge or 0
	 *  on failure
	 */
	private int joinWith(int u, int v, int e) {
		if (e == 0 || !edges.isOut(e)) return 0;
		edges.swap(e);

		// initialize edge information
		evec[e].l = u; evec[e].r = v;
	
		// add edge to the adjacency lists
		// in the adjLists data structure, each edge appears twice,
		// as 2*e and 2*e+1
		if (fe[u] != 0) adjLists.join(2*e,fe[u]);
		if (fe[v] != 0) adjLists.join(2*e+1,fe[v]);
		if (fe[u] == 0) fe[u] = 2*e;
		if (fe[v] == 0) fe[v] = 2*e+1;
	
		M++;
	
		return e;
	}
	
	/** Remove an edge from the graph.
	 *  @param e is the edge to be removed.
	 *  @return true on success, false on failure
	 */
	public boolean remove(int e) {
		assert(1 <= e && e <= maxEdge);
		if (edges.isOut(e)) return false;
		edges.swap(e);
	
		int u = evec[e].l;
		if (fe[u] == 2*e)
			fe[u] = (adjLists.suc(2*e) == 2*e ?
				 0 :adjLists.suc(2*e));
		u = evec[e].r;
		if (fe[u] == 2*e+1)
			fe[u] = (adjLists.suc(2*e+1) == 2*e+1 ?
					0 : adjLists.suc(2*e+1));
	
		adjLists.remove(2*e); adjLists.remove(2*e+1);
	
		evec[e].l = 0;
	
		M--;
		return true;
	}
	
	// Compare two edges incident to the same endpoint u.
	// Return -1 if u's mate in e1 is less than u's mate in e2.
	// Return +1 if u's mate in e1 is greater than than u's mate in e2.
	// Return  0 if u's mate in e1 is equal to its mate in e2.
	public int ecmp(int e1, int e2, int u) {
		if (mate(u,e1) < mate(u,e2)) return -1;
		else if (mate(u,e1) > mate(u,e2)) return 1;
		else return 0;
	}
	
	/** Sort an adjacency list for a specified vertex using ecmp().
	 *  @param u is the vertex whose adjacency list is to be sorted.
	 */
	public void sortAlist(int u) {
		int e; int j, k, p, c;
	
		if (fe[u] == 0) return; // empty list
	
		int [] elist = new int[N+1];
	
		// copy edges in adjacency list for u into an array
		k = 1; elist[k++] = fe[u];
		for (e = adjLists.suc(fe[u]); e != fe[u]; ) {
			if (k > N) Util.fatal("sortAlist: adjacency list "
						+ "too long");
			elist[k++] = e;
			int f = e; e = adjLists.suc(e); adjLists.remove(f);
		}
		k--;
		// put int list in heap-order using mate(u) as key
		for (j = k/2; j >= 1; j--) {
			// do pushdown starting at position j
			e = elist[j]; p = j;
			while (true) {
				c = 2*p;
				if (c > k) break;
				if (c+1 <= k &&
				    ecmp(elist[c+1]/2,elist[c]/2,u) > 0)
					c++;
				if (ecmp(elist[c]/2,e/2,u) <= 0) break;
				elist[p] = elist[c]; p = c;
			}
			elist[p] = e;
		}
		// repeatedly extract the edge with largest mate(u) from heap
		// and restore heap order
		for (j = k-1; j >= 1; j--) {
			e = elist[j+1]; elist[j+1] = elist[1];
			// now largest edges are in positions j+1,...,k
			// elist[1,...,j] forms a heap with edge having
			// largest mate(u) on top
			// pushdown from 1 in this restricted heap
			p = 1;
			while (true) {
				c = 2*p;
				if (c > j) break;
				if (c+1 <= j &&
				    ecmp(elist[c+1]/2,elist[c]/2,u) > 0)
					c++;
				if (ecmp(elist[c]/2,e/2,u) <= 0) break;
				elist[p] = elist[c]; p = c;
			}
			elist[p] = e;
		}
		// now elist is sorted by mate(u)
	
		// now rebuild links forming adjacency list for u
		for (j = k-1; j >= 1; j--) {
			adjLists.join(elist[j],elist[j+1]);
		}
		fe[u] = elist[1];
	}
	
	/** Sort all the adjacency lists. */
	public void sortAdjLists() {
		for (int u = 1; u <= N; u++) sortAlist(u);
	}
	
	/** Create a string representation of an edge.
	 *  In the returned string, the "left" endpoint of the edge appears
	 *  first.
	 *  @param e is an edge number
	 *  @return a String representing the edge
	 */
	public String edge2string(int e) {
		String s = "(";
		int u = left(e); int v = right(e);
		s += Util.node2string(u,n()) + ",";
		s += Util.node2string(v,n()) + ")";
		return s;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	public String edge2string(int e, int u) {
		String s = "(";
		int v = mate(u,e);
		s += Util.node2string(u,n()) + ",";
		s += Util.node2string(v,n()) + ")";
		return s;
	}
	
	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @return a String representing the list
	 */
	public String alist2string(int u) {
		String s = "";
		if (firstAt(u) == 0) return s;
		int cnt = 0;
		for (int e = firstAt(u); e != 0; e = nextAt(u,e)) {
			s += edge2string(e,u) + " ";
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
	 *  @return a reference to the string
	 */
	public String toString() {
		String s = n() + " " + m() + "\n";
		for (int u = 1; u <= n(); u++) 
			s += alist2string(u);
		return s;
	}
	
	/** Construct a string in dot file format representation 
	 *  of the Graph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @param s is a string object provided by the caller which
	 *  is modified to provide a representation of the Graph.
	 *  @return a reference to the string
	 */
	public String toDotString() {
		// undirected graph
		String s = "graph G { " + "\n";
		for (int u = 1; u <= n(); u++) {
			if (firstAt(u) == 0) break;
			String su = "";
			for (int e = firstAt(u); e != 0; e = nextAt(u,e)) {
				int v = mate(u,e);
	                        if (v > u)  break;
				su += Util.node2string(u,n()) + " -- ";
				su += Util.node2string(v,n());
				su += " ; "; 
			}
	                if (su.length() != 0) s += su + "\n";
		}
		s += " }\n";
		return s;
	}
	
	/** Read one edge from an input stream, add it to the graph.
	 *  Since for undirected graphs, edges appear on both adjacency lists,
	 *  ignore an edge if its second vertex is larger than the first.
	 *  @param in is an open input stream
	 *  @return true on success, false on error.
	 */
	public boolean readEdge(PushbackReader in) {
	        int u=-1, v=-1;
	        if (!Util.verify(in,'(') || (u = Util.readNode(in,n())) == 0 ||
	            !Util.verify(in,',') || (v = Util.readNode(in,n())) == 0 ||
	            !Util.verify(in,')')) {
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
	public boolean read(PushbackReader in) {
	        Util.MutableInt numv = new Util.MutableInt();
	        Util.MutableInt nume = new Util.MutableInt();
		
		if (!Util.readNum(in,numv) || !Util.readNum(in,nume))
			return false;
		if (N != numv.val || maxEdge < nume.val)
			resize(numv.val,nume.val); 
	        else reset();
	        for (int i = 1; i <= 2*nume.val; i++) {
	                if (!readEdge(in)) return false;
	        }
	        if (M != nume.val) return false;
	        sortAdjLists();
	        return true;
	}
	
	/** Scamble the vertices and edges in the graph.
	 */
	public void scramble() {
		int [] vp = new int[N+1]; int [] ep = new int[maxEdge+1];
		Util.genPerm(N,vp); Util.genPerm(maxEdge,ep);
		shuffle(vp,ep);
		sortAdjLists();
	}
	
	/** Shuffle the vertices and edges according to the given permutations.
	 *  More precisely, remap all vertices u to vp[u] and all
	 *  edges e to ep[e].
	 */
	public void shuffle(int vp[], int ep[]) {
		int u; int e;
		EdgeInfo [] evec1 = new EdgeInfo[maxEdge+1];
	
		for (e = 1; e <= maxEdge; e++) evec1[e].l = evec1[e].r = 0;
		for (e = first(); e != 0; e = next(e)) evec1[e] = evec[e];
		adjLists.reset(); edges.reset();
		for (u = 1; u <= N; u++) fe[u] = 0;
		for (e = 1; e <= maxEdge; e++) {
			if (evec1[e].l != 0)
				joinWith(vp[evec1[e].l],vp[evec1[e].r],ep[e]);
		}
	}
	
	/** Generate a random graph. 
	 *  @param numv is the number of vertices in the random graph;
	 *  if this object has N>numv, the graph is generated over the
	 *  first numv vertices, leaving the remaining vertices with no edges
	 *  @param nume is the number of edges in the graph
	 */  
	public void rgraph(int numv, int nume) {
		numv = Math.max(0,numv); nume = Math.max(0,nume);
		if (numv > N || nume > maxEdge) resize(numv,nume); 
	        else reset();
		addEdges(numv,nume);
		sortAdjLists();
	}

	/** Test to see if two vertices are connected */
	public boolean connected(int u, int v) {
		for (int e = firstAt(u); e != 0; e = nextAt(u,e))
			if (v == mate(u,e)) return true;
		return false;
	}
	
	/** Add random edges to a graph.
	 *  @param numv is the number of vertices; edges are generated
	 *  joining vertices with vertex numbers in 1..numv
	 *  @param nume is the target number of edges; if the graph already
	 *  has some edges, additional edges will be added until the
	 *  graph has nume edges
	 */
	public void addEdges(int numv, int nume) {
		// build set containing edges already in graph
		algoLib.dataStructures.basic.HashSet edgeSet;
		edgeSet = new algoLib.dataStructures.basic.HashSet(nume);
		for (int e = first(); e != 0; e = next(e)) {
			int u = Math.min(left(e), right(e));
			int v = Math.max(left(e), right(e));
			long vpair = u; vpair <<= 32; vpair |= v;
			edgeSet.insert(vpair);
		}
	
		// add edges using random sampling of vertex pairs
		// stop early if graph gets so dense that most samples
		// repeat edges already in graph
		while (m() < nume && m()/numv < numv/4) {
			int u = Util.randint(1,numv);
			int v = Util.randint(1,numv);
			if (u == v) continue;
			if (u > v) { int w = u; u = v; v = w; }
			long vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) {
				edgeSet.insert(vpair); join(u,v);
			}
		}
		if (m() == nume) return;
	
		// if more edges needed, build a vector containing remaining 
		// "candidate" edges and then sample from this vector
		Vector<Long> vpVec = new Vector<Long>();
		for (int u = 1; u < numv; u++) {
			int v;
			for (v = u+1; v <= numv; v++) {
				long vpair = u; vpair <<= 32; vpair |= v;
				if (!edgeSet.member(vpair)) vpVec.add(vpair);
			}
		}
		// sample remaining edges from vector
		int i = 0;
		while (m() < nume && i < vpVec.size()) {
			int j = Util.randint(i,vpVec.size()-1);
			long vpair = vpVec.get(j);
			int u = (int) (vpair >> 32);
			int v = (int) (vpair & 0xffffffff);
			join(u,v); vpVec.set(j,vpVec.get(i++));
		}
	}
	
	
	/** Generate a random bipartite graph.
	 *  @param numv specifies the number of vertices per "part";
	 *  so the resulting graph will have 2*numv vertices;
	 *  if this object has N>2*numv, the random graph is generated
	 *  over the first 2*numv vertices,
	 *  leaving the remaining vertices with no edges
	 *  @param maxEdge is the max number of edges in the random graph
	 */
	public void rbigraph(int numv, int nume) {
		numv = Math.max(1,numv); nume = Math.max(0,nume);
		if (N < 2*numv || maxEdge < nume) resize(2*numv,nume); 
	        else reset();
	
		// build set containing edges already in graph
		algoLib.dataStructures.basic.HashSet edgeSet;
		edgeSet = new algoLib.dataStructures.basic.HashSet(nume);
		for (int e = first(); e != 0; e = next(e)) {
			int u = Math.min(left(e), right(e));
			int v = Math.max(left(e), right(e));
			long vpair = u; vpair <<= 32; vpair |= v;
			edgeSet.insert(vpair);
		}
	
		// add edges using random sampling of int pairs
		// stop early if graph gets so dense that most samples
		// repeat edges already in graph
		while (m() < nume && m()/numv < numv/2) {
			int u = Util.randint(1,numv);
			int v = Util.randint(1,numv); v += numv;
			long vpair = u; vpair <<= 32; vpair |= v;
			if (!edgeSet.member(vpair)) {
				edgeSet.insert(vpair); join(u,v);
			}
		}
		if (m() == nume) return;
	
		// if more edges needed, build a vector containing remaining 
		// "candidate" edges and then sample from this vector
		Vector<Long> vpVec = new Vector<Long>();
		for (int u = 1; u <= numv; u++) {
			for (int v = numv+1; v <= 2*numv; v++) {
				long vpair = u; vpair <<= 32; vpair |= v;
				if (!edgeSet.member(vpair)) vpVec.add(vpair);
			}
		}
		// sample remaining edges from vector
		int i = 0;
		while (m() < nume && i < vpVec.size()) {
			int j = Util.randint(i,vpVec.size()-1);
			int u = (int) (vpVec.get(j) >> 32);
			int v = (int) (vpVec.get(j) & 0xffffffff);
			join(u,v); vpVec.set(j,vpVec.get(i++));
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
	public void rtree(int numv) {
		// build a random sequence of n-2 vertex numbers
		// these can be interpreted as "edge endpoints" for
		// the non-leaf vertices in the tree to be generated;
		// as we're doing this, compute the vertex degrees
		int [] endpoints = new int[numv-1];
		int [] d = new int[numv+1];
		for (int i = 1; i <= numv; i++) d[i] = 1;
		for (int i = 1; i <= numv-2; i++) {
			endpoints[i] = Util.randint(1,numv);
			d[endpoints[i]]++;
		}
		// now build a heap containing all leaves in the tree
		// being generated
		Dheap degOne = new Dheap(numv,2);
		for (int u = 1; u <= numv; u++) {
			if (d[u] == 1) degOne.insert(u,u);
		}
		// construct tree based on Cayley's theorem
		for (int i = 1; i <= numv-2; i++) {
			int u = degOne.deletemin();
			int v = endpoints[i];
			join(u,v);
			if (--d[v] == 1) degOne.insert(v,v);
		}
		join(degOne.deletemin(),degOne.deletemin());
		sortAdjLists();
	}
	
	/** Create a random simple, connected graph.
	 */
	public void rcgraph(int numv, int nume) {
		// try standard random graph generation
		rgraph(numv,nume);
	
		if (getComponents(null) == 1) return;
		
		// graph too sparse for standard method to produce
		// connected graph so start over, adding edges to a random
		// tree
		reset();
		rtree(numv);
		addEdges(numv,nume);
		sortAdjLists();
	}
	
	/** Get an edge joining two vertices.
	 *  @param u is a vertex number
	 *  @param v is a vertex number
	 *  @return the number of some edge joining u and v, or 0 if there
	 *  is no such edge
	 */
	int getEdge(int u, int v) {
		for (int e = firstAt(u); e != 0; e = nextAt(u,e))
			if (mate(u,e) == v) return e;
		return 0;
	}
	
	/** Get the components of a graph.
	 *  @param component is an array that is used to return the result of
	 *  the computation; if component is not null, then it is expected to
	 *  point to an array with at least n()+1 integers;
	 *  on return component[u] is an integer "component number";
	 *  vertices with the same component number are in the same
	 *  connected of the graph; callers interested
	 *  only in the number of components may use a null argument
	 *  @return the number of connected components
	 */
	public int getComponents(int [] component) {
		if (component == null) component = new int[n()+1];
		for (int u = 1; u <= n(); u++) component[u] = 0;
		
		List q = new List(n());
		int curComp = 0;
		int s = 1;
		while (s <= n()) {
			// do a breadth-first search from s, labeling all
			// vertices found with the current component number
			component[s] = ++curComp; q.addLast(s);
			while (!q.empty()) {
				int u = q.first(); q.removeFirst();
				for (int e = firstAt(u); e != 0;
					 e = nextAt(u,e)) {
					int v = mate(u,e);
					if (component[v] == 0) {
						component[v] = curComp;
						q.addLast(v);
					}
				}
			}
			// scan ahead to next int that has not yet been
			// placed in some component
			while (s <= n() && component[s] != 0) s++;
		}
		return curComp;
	}
}
