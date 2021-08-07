/** @file Graph.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.graphs;

import java.io.*;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Scanner;
import grafalgo.misc.Util;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.List;
import grafalgo.dataStructures.basic.Dlists;
import grafalgo.dataStructures.basic.ListPair;

/** Data structure for undirected graph.
 *
 *  Graph size (number of vertices and max number of edges) must
 *  be specified when a Graph object is instantiated.
 *  Edges can be added and deleted from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
public class Graph extends Adt {
	protected int[] firstEp;	 ///< firstEp[v] is first edge endpoint at v
	protected int[] Left;		///< Left[e] is left endpoint of edge e
	private int[] Right;		///< Right[e] is right endpoint of edge e
	private ListPair edges;		///< sets of in-use and free edges
	private Dlists epLists;		///< lists of the edge endpoints at each vertex

	/** Construct Graph with space for a specified # of vertices and edges.
	 */
	public Graph(int n, int nMax, int mMax) { super(n); init(n, nMax, mMax); }
	public Graph(int n) { super(n); init(n, n, 3*n()); }
	public Graph() { super(); init(n(), n(), 3*n()); }

	private void init(int n, int nMax, int mMax) {
		assert(n > 0 && nMax >= n && mMax > 0);
		firstEp = new int[nMax+1]; Arrays.fill(firstEp, 0);
		Left = new int[mMax+1]; Right = new int[mMax+1];
		edges = new ListPair(mMax);
		epLists = new Dlists(2*(mMax+1));
	}

	public void reset(int n, int nMax, int mMax) {
		assert(n > 0 && nMax >= n && mMax > 0);
		super.setRange(n); init(n, nMax, mMax);
	}

	public void reset(int n) { reset(n, n, 3*n); }

	public void expand(int n, int m) {
		if (n <= n() && m <= m()) return;
		if (n+1 > firstEp.length || m+1 > Left.length) {
			int nMax = (n+1 <= firstEp.length ? firstEp.length-1 :
							Math.max(n+1, (int) (1.25*firstEp.length)));
			int mMax = (m+1 <= Left.length ? Left.length-1:
							Math.max(m+1, (int) (1.25*Left.length)));
			Graph nu = new Graph(n(), nMax, mMax);
			nu.assign(this); this.xfer(nu);
		}
		Arrays.fill(firstEp, n()+1, n+1, 0);
		setRange(n);
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is to replace this one.
	 */
	public void assign(Graph g) {
		if (g == this) return;
		if (g.n()+1 > firstEp.length || g.m()+1 > Left.length) {
			reset(g.n(), g.n(), g.m());
		} else {
			clear(); setRange(g.n());
		}
		for (int e = g.first(); e != 0; e = g.next(e)) {
			join(g.left(e), g.right(e));
		}
		sortEndpointLists();
	}

	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph that is to replace this one.
	 */
	protected void xfer(Graph g) {
		firstEp = g.firstEp; Left = g.Left; Right = g.Right;
		edges = g.edges; epLists = g.epLists;
		g.firstEp = g.Left = g.Right = null;
		g.edges = null; g.epLists = null;
	}

	/** Remove all the edges from a graph.  */
	public void clear() {
		epLists.clear(); edges.clear();
		for (int u = 1; u <= n(); u++) firstEp[u] = 0;
	}

	/** Get the number of vertices.
	 *  @return the number of vertices in the graph.
	 */
	public int n() { return super.n(); }
	
	/** Get the number of edges.
	 *  @return the number of edges in the graph.
	 */
	public int m() { return edges.nIn(); }
	
	public boolean validVertex(int u) { return 1 <= u && u <= n(); }

	/** Determine if an edge number corresponds to a valid edge.
	 *  @param e is the edge number to be verified
	 *  @return true if e is a valid edge number, else false.
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
		assert(validVertex(v)); return firstEp[v]/2;
	}
	
	/** Get the next edge in the adjacency list for a specific vertex.
	 *  @param v is the vertex whose adjacency list we're accessing
	 *  @param e is the edge whose successor is requested
	 *  @return the next edge in the adjacency list for v
	 *  or 0 if e is not incident to v or is the last edge on the list
	 */
	public int nextAt(int v, int e) {
		assert(validVertex(v) && validEdge(e));
		if (v != Left[e] && v != Right[e]) return 0;
		int ep = (v == Left[e] ? 2*e : 2*e+1);
		return epLists.next(ep) / 2;
	}
	
	/** Get the left endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the left endpoint of e, or 0 if e is not a valid edge.
	 */
	public int left(int e) {
		assert(e == 0 || validEdge(e));
		return Left[e];
	}
	
	/** Get the right endpoint of an edge.
	 *  @param e is the edge of interest
	 *  @return the right endpoint of e, or 0 if e is not a valid edge.
	 */
	public int right(int e) {
		assert(e == 0 || validEdge(e));
		return Right[e];
	}
	
	/** Get the other endpoint of an edge.
	 *  @param v is a vertex
	 *  @param e is an edge incident to v
	 *  @return the other vertex incident to e
	 */
	public int mate(int v, int e) {
		assert(validVertex(v) && validEdge(e) &&
			   (v == Left[e] || v == Right[e]));
		return v == Left[e] ? Right[e] : Left[e];
	}

	public int join(int u, int v) {
		//assert(validVertex(u) && validVertex(v));
		return joinWith(u, v, edges.firstOut());
	}

	/** Join two vertices with a specific edge.
	 *  @param u is the left endpoint for the new edge
	 *  @param v is the right endpoint for the new edge
	 *  @param e is the number of an "unused" edge
	 *  @return the edge number for the new edge or 0
	 *  on failure
	 */
	protected int joinWith(int u, int v, int e) {
		assert(u > 0 && v > 0 && e > 0 && !edges.isIn(e));
		if (u > n() || v > n() || !edges.isOut(e))
			expand(Math.max(u, v), e);
		edges.swap(e);

		// initialize edge information
		Left[e] = u; Right[e] = v;
	
		// add edge to the endpoint lists
		firstEp[u] = epLists.join(firstEp[u], 2*e);
		firstEp[v] = epLists.join(firstEp[v], 2*e+1);
	
		return e;
	}
	
	/** Delete an edge from the graph.
	 *  @param e is the edge to be deleted.
	 *  @return true on success, false on failure
	 */
	public boolean delete(int e) {
		assert(validEdge(e));
		edges.swap(e);
		int u = Left[e];  firstEp[u] = epLists.delete(2*e,   firstEp[u]);
		int v = Right[e]; firstEp[v] = epLists.delete(2*e+1, firstEp[v]);
		return true;
	}
	
	// Compare two edges incident to the same endpoint u.
	// Return -1 if u's mate in e1 is less than u's mate in e2.
	// Return +1 if u's mate in e1 is greater than than u's mate in e2.
	// Return  0 if u's mate in e1 is equal to its mate in e2.
	protected int ecmp(int e1, int e2, int u) {
		assert(validVertex(u) && validEdge(e1) && validEdge(e2));
		if (mate(u, e1) < mate(u, e2)) return -1;
		else if (mate(u, e1) > mate(u, e2)) return 1;
		else return 0;
	}
	
	/** Sort an endpoint list for a specified vertex using ecmp().
	 *  @param u is the vertex whose adjacency list is to be sorted.
	 */
	public void sortEndpointList(int u) {
		assert(u != 0 && validVertex(u));
		if (firstEp[u] == 0) return; // empty list

		// if already sorted, skip sorting step
		for (int e = firstAt(u); e != 0; e = nextAt(u, e)) {
			if (nextAt(u, e) == 0) return; // already sorted
			if (ecmp(e, nextAt(u, e), u) > 0) break; // edge out of order
		}
	
		// copy endpoints in endpoint list for u into an array
		// and remove them from endpoint list
		int k = 1; int ep; int[] epl = new int[n()+1];
		for (ep = firstEp[u]; ep != 0; ep = firstEp[u]) {
			epl[k++] = ep; firstEp[u] = epLists.delete(ep, firstEp[u]);
		}
		k--;
		// put int list in heap-order using mate(u) as key
		int j, p, c;
		for (j = k/2; j >= 1; j--) {
			// do pushdown starting at position j
			ep = epl[j]; p = j;
			while (true) {
				c = 2*p;
				if (c > k) break;
				if (c+1 <= k &&
					ecmp(epl[c+1]/2,epl[c]/2,u) > 0)
					c++;
				if (ecmp(epl[c]/2,ep/2,u) <= 0) break;
				epl[p] = epl[c]; p = c;
			}
			epl[p] = ep;
		}
		// repeatedly extract the edge with largest mate(u) from heap
		// and restore heap order
		for (j = k-1; j >= 1; j--) {
			ep = epl[j+1]; epl[j+1] = epl[1];
			// now largest edges are in positions j+1,...,k
			// epl[1,...,j] forms a heap with edge having
			// largest mate(u) on top
			// pushdown from 1 in this restricted heap
			p = 1;
			while (true) {
				c = 2*p;
				if (c > j) break;
				if (c+1 <= j &&
					ecmp(epl[c+1]/2,epl[c]/2,u) > 0)
					c++;
				if (ecmp(epl[c]/2,ep/2,u) <= 0) break;
				epl[p] = epl[c]; p = c;
			}
			epl[p] = ep;
		}
		// now epl is sorted by mate(u)
	
		// now rebuild links forming adjacency list for u
		for (j = k-1; j >= 1; j--) {
			epLists.join(epl[j], epl[j+1]);
		}
		firstEp[u] = epl[1];
	}
	
	/** Sort adjacency lists for all vertices by "other endpoinnt". */
	public void sortEndpointLists() {
		for (int u = 1; u <= n(); u++) sortEndpointList(u);
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	public String edge2string(int e, int u) {
		int v = mate(u, e);
		return "(" + index2string(u) + ","  + index2string(v) + ")";
	}
	
	/** Create a string representation of an edge.
	 *  In the returned string, the "left" endpoint of the edge appears
	 *  first.
	 *  @param e is an edge number
	 *  @return a String representing the edge
	 */
	public String edge2string(int e) { return edge2string(e, left(e)); }

	/** Create a string representation of an edge list.
	 *  @param elist is a list of edge numbers
	 *  @return the string
	 */
	public String elist2string(ArrayList<Integer> elist) {
		String s = "";
		for (int e : elist) {
			if (s.length() > 0) s += " ";
			s += edge2string(e);
		}
		return "[" + s + "]";
	}

	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @return a String representing the list
	 */
	public String adjacencyList2string(int u, boolean showEdgeNum) {
		String s = "";
		s += "[" + index2string(u) + "|";
		int lineStart = 0;
		for (int e = firstAt(u); e != 0; e = nextAt(u, e)) {
			s += " " + index2string(mate(u, e));
			if (showEdgeNum) s += "." + e;
			if (s.length()-lineStart > 65 && nextAt(u, e) != 0) {
				s += "\n";
				lineStart = s.length();
			}
		}
		s += "]\n";
		return s;
	}
	public String adjacencyList2string(int u) {
		return adjacencyList2string(u, false);
	}

	/** Compare another graph to this one.
	 *  @param a is a Graph object
	 *  @return true if a is equal to this; that is, it has the same
	 *  vertices and edges; note: the adjacency lists will be sorted
	 *  as a side-effect
	 */
	public boolean equals(Adt a) {
		if (a == this) return true;
        if (!(a instanceof Graph)) return false;
        Graph g = (Graph) a;

		if (g.n() != n() || g.m() != m()) return false;
		sortEndpointLists(); g.sortEndpointLists();
		for (int u = 1; u <= n(); u++) {
			int e = firstAt(u); int eg = g.firstAt(u);
			while (e != 0 && eg != 0) {
				if (mate(u, e) != g.mate(u, eg))
					return false;
				e = nextAt(u, e); eg = g.nextAt(u, eg);
			}
			if (e != eg) return false;
		}
		return true;
	}
	
	/** Construct a string representation of the Graph object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @return a reference to the string
	 */
	public String toString(boolean showEdgeNum) {
		String s = "";
		for (int u = 1; u <= n(); u++) 
			s += adjacencyList2string(u, showEdgeNum);
		return "{\n" + s + "}\n";
	}
	public String toString() { return toString(false); }
	
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
		String s = "graph G {\n";
		int cnt = 0;
		for (int e = first(); e != 0; e = next(e)) {
			int u = Math.min(left(e),right(e));
			int v = Math.max(left(e),right(e));
			s += index2string(u) + " -- ";
			s += index2string(v) + " ; ";
			if (++cnt == 15) { cnt = 0; s += "\n"; }
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
	public boolean readEdge(Scanner in) {
			int u=-1, v=-1;
			if (!verify(in, "\\(") || (u = readIndex(in)) == 0 ||
				!verify(in, ",")   || (v = readIndex(in)) == 0 ||
				!verify(in, "\\)")) {
					return false;
			}
			if (u < 1 || u > n() || v < 1 || v > n()) return false;
			if (u < v) join(u,v);
			return true;
	}
		
	/** Read adjacency list from an input stream, add it to the graph.
	 *  @param in is an open input stream
	 *  @return true on success, false on error.
	 */
	public boolean readAdjacencyList(Scanner in) {
		if (!verify(in, "\\[")) return false;
		int u = readIndex(in);
		if (u == 0) return false;
		if (u > n()) expand(u, Left.length);
		if (!verify(in, "\\|")) return false;
		while (!verify(in, "\\]")) {
			int v = readIndex(in);
			if (v == 0) return false;
			if (v > n()) expand(v, Left.length);
			if (!verify(in, "\\.")) {
				if (u < v) join(u, v);
			} else {
				int e;
				try { e = in.nextInt(); } catch(Exception x) { return false; }
				if (e >= m()) expand(n(), e);
				if (u < v) {
					if (joinWith(u, v, e) != e) return false;
				} else { // endpoints already joined, just verify
					if ((u == left(e)  && v != right(e)) ||
						(u == right(e) && v != left(e)))
						return false;
				}
			}
		}
		return true;
	}

	/** Read a graph.
	 *  @param in is an open input stream
	 *  @return true on success, else false
	 */
	public boolean read(Scanner in) {
		clear();
		if (!verify(in, "\\{")) return false;
		while (readAdjacencyList(in)) {
			if (verify(in, "\\}")) {
				sortEndpointLists(); return true;
			}
		}
		return false;
	}
	
	/** Find an edge joining two vertices.
	 *  @param u is a vertex number
	 *  @param v is a vertex number
	 *  @return the number of some edge joining u and v, or 0 if there
	 *  is no such edge
	 */
	public int findEdge(int u, int v) {
		assert(validVertex(u) && validVertex(v));
		for (int e = firstAt(u); e != 0; e = nextAt(u,e))
			if (mate(u,e) == v) return e;
		return 0;
	}

	/** Compute the degree of a vertex.
	 *  @param u is a vertex
	 *  @return the number of edges incident to u
	 */
	public int degree(int u) {
		assert(validVertex(u));
		int d = 0;
		for (int e = firstAt(u); e != 0; e = nextAt(u,e)) d++;
		return d;
	}
	
	/** Compute the maximum degree.
	 *  @return the maximum degree of any vertex.
	 */
	public int maxDegree() {
		int d = 0;
		for (int u = 1; u <= n(); u++) d = Math.max(d, degree(u));
		return d;
	}
	
	/** Get the components of a graph.
	 *  @return a component vector, that assigns a "component number" to each
	 *  vertex; that is, vertices in the same component have the same
	 *  component number
	 */
	public int[] getComponents() {
		int[] component = new int[n()+1];
		for (int u = 1; u <= n(); u++) component[u] = 0;
		Arrays.fill(component, 0);
		
		List q = new List(n());
		int curComp = 0;
		int s = 1;
		while (s <= n()) {
			// do a breadth-first search from s, labeling all
			// vertices found with the current component number
			component[s] = ++curComp; q.enq(s);
			while (!q.empty()) {
				int u = q.deq();
				for (int e = firstAt(u); e != 0; e = nextAt(u,e)) {
					int v = mate(u,e);
					if (component[v] == 0) {
						component[v] = curComp; q.enq(v);
					}
				}
			}
			// scan ahead to next int that has not yet been
			// placed in some component
			while (s <= n() && component[s] != 0) s++;
		}
		return component;
	}
}
