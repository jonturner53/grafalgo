/** @file Graph_w.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.graphs;

import java.io.*;
import java.util.Arrays;
import java.util.Scanner;
import grafalgo.misc.Util;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.List;
import grafalgo.dataStructures.basic.Dlists;
import grafalgo.dataStructures.basic.ListPair;

/** Data structure for weighted undirected graph.
 *  Extends Graph class, adding edge weights.
 */
public class Graph_w extends Graph {
	private int[] Weight; ///< Weight[e] is weight of edge e

	/** Construct Graph_w with space for a specified # of vertices and edges.
	 */
	public Graph_w(int n, int nMax, int mMax) {
		super(n, nMax, mMax);
		init(mMax);
	} 
	public Graph_w(int n) { super(n); init(Left.length); } 
	public Graph_w() { super(); init(Left.length); }

	private void init(int mMax) {
		assert(mMax > 0);
		Weight = new int[mMax+1]; Arrays.fill(Weight, 0);
	}

	@Override
	public void reset(int n, int nMax, int mMax) {
		assert(n > 0 && nMax >= n && mMax > 0);
		super.reset(n, nMax, mMax); init(mMax);
	}

	@Override
	public void expand(int n, int m) {
		if (n <= n() && m <= m()) return;
        if (n+1 > firstEp.length || m+1 > Left.length) {
            int nMax = (n+1 <= firstEp.length ? firstEp.length-1 :
                            Math.max(n+1, (int) (1.25*firstEp.length)));
            int mMax = (m+1 <= Left.length ? Left.length-1:
                            Math.max(m+1, (int) (1.25*Left.length)));
			Graph_w nu = new Graph_w(n(), nMax, mMax);
			nu.assign(this); this.xfer(nu);
		}
		setRange(n);
	}

	/** Assign one graph to another.
	 *  @param g is another graph that is copied to this one
	 */
	public void assign(Graph_w g) {
		super.assign(g);
		if (Weight.length != Left.length) init(Left.length-1);
		for (int e = g.first(); e != 0; e = g.next(e))
			Weight[e] = g.Weight[e];
	}
	
	/** Assign one graph to another by transferring its contents.
	 *  @param g is another graph whose contents is traferred to this one
	 */
	public void xfer(Graph_w g) {
		super.xfer(g); this.Weight = g.Weight; g.Weight = null;
	}

	/** Get the weight of an edge.
	 *  @param e is an edge
	 *  @return the weight of e
	 */
	public int weight(int e) { assert(validEdge(e)); return Weight[e]; }

	/** Set the weight of an edge.
	 *  @param e is an edge
	 *  @param w is a weight to be assigned to e
	 */
	public void setWeight(int e, int w) {
assert(validEdge(e)); Weight[e] = w; }

	/** Compare another graph to this one.
	 *  @param a is a Graph_w to be compared to this
	 *  @return true if a is equal to this; that is, it has the same
	 *  vertices, edges and edge weights; note: endpoint lists are
	 *  sorted as a side effect
	 */
	@Override
	public boolean equals(Adt a) {
		if (a == this) return true;
        if (!(a instanceof Graph_w)) return false;
		if (!super.equals(a)) return false;
        Graph_w g = (Graph_w) a;

		// so we have same edges in same order, now check that weights match
		for (int u = 1; u <= n(); u++) {
			int e = firstAt(u); int eg = g.firstAt(u);
			while (e != 0) { 
				if (weight(e) != g.weight(eg))
					return false;
				e = nextAt(u, e); eg = g.nextAt(u, eg);
			}
		}
		return true;
	}

	/** Compare two edges incident to the same endpoint u.
	 *  @return -1 if u's mate in e1 is less than u's mate in e2,
	 *  return +1 if u's mate in e1 is greater than than u's mate in e2,
	 *  return  0 if u's mate in e1 is equal to its mate in e2.
	 */
	@Override
	protected int ecmp(int e1, int e2, int u) {
		assert(validVertex(u) && validEdge(e1) && validEdge(e2));
		int status = super.ecmp(e1, e2, u);
		if (status != 0) return status;
		// now use weights to break ties
		     if (weight(e1) < weight(e2)) return -1;
		else if (weight(e1) > weight(e2)) return 1;
		else return 0;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e;
	 *  it will appear first in the string
	 *  @return a string representing the edge
	 */
	@Override
	public String edge2string(int e, int u) {
		int v = mate(u, e);
		return "(" + index2string(u) + ","  + index2string(v) +
			   "," + weight(e) + ")";
	}
	
	/** Create a string representation of an adjacency list.
	 *  @param u is a vertex number
	 *  @return a String representing the list
	 */
	@Override
	public String adjacencyList2string(int u, boolean showEdgeNum) {
		String s = "";
		s += "[" + index2string(u) + "|";
		int lineStart = 0;
		for (int e = firstAt(u); e != 0; e = nextAt(u, e)) {
			s += " " + index2string(mate(u, e));
			if (showEdgeNum) s += "." + e;
			s += ":" + weight(e);
			if (s.length()-lineStart > 65 && nextAt(u, e) != 0) {
				s += "\n"; lineStart = s.length();
			}
		}
		s += "]\n";
		return s;
	}
	
	/** Construct a string in dot file format representation 
	 *  of the Graph_w object.
	 *  For small graphs (at most 26 vertices), vertices are
	 *  represented in the string as lower case letters.
	 *  For larger graphs, vertices are represented by integers.
	 *  @param s is a string object provided by the caller which
	 *  is modified to provide a representation of the Graph_w.
	 *  @return a reference to the string
	 */
	public String toDotString() {
		// undirected graph
		String s = "graph G {\n";
		for (int e = first(); e != 0; e = next(e)) {
			int u = Math.min(left(e),right(e));
			int v = Math.max(left(e),right(e));
			s += index2string(u) + " -- ";
			s += index2string(v) + " ; ";
			s += " [label = \" " + weight(e) + " \"] ; ";
			if (s.length() > 65) s += "\n";
		}
		s += " }\n";
		return s;
	}
		
	/** Read adjacency list from an input stream, add it to the graph.
	 *  @param in is an open input stream
	 *  @return true on success, false on error.
	 */
	public boolean readAdjacencyList(Scanner in) {
		if (!verify(in, "\\[")) { clear(); return false; }
		int u = readIndex(in);
		if (u == 0) { clear(); return false; }
		if (u > n()) expand(u, Left.length);
		if (!verify(in, "\\|")) { clear(); return false; }
		in.useDelimiter("\\s|\\]");
		while (!verify(in, "\\]")) {
			int v = readIndex(in); int e = 0;;
			if (v == 0) { clear(); return false; }
			if (v > n()) expand(v, Left.length);
			if (!verify(in, "\\.")) {
				if (u < v) e = join(u, v);
			} else {
				try { e = in.nextInt(); }
				catch(Exception x) { clear(); return false; }
				if (e >= m()) expand(n(), e);
				if (u < v) {
					if (joinWith(u, v, e) != e) {
						clear(); return false;
					}
				} else { // endpoints already joined, just verify
					if ((u == left(e)  && v != right(e)) ||
						(u == right(e) && v != left(e)))
						clear(); return false;
				}
			}
			if (!verify(in, ":")) { clear(); return false; }
			int w;
			try { w = in.nextInt(); }
			catch(Exception x) { clear(); return false; }
			if (u < v) setWeight(e, w);
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
}
