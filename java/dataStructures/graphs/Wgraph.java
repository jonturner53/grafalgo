/** @file @Wgraph.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.graphs;
import algoLib.misc.*;
import algoLib.dataStructures.basic.*;
import java.io.*;
import java.util.*;

/** Data structure for undirected graph with edge weights.
 *  Adds edge weights to Graph class.
 */
public class Wgraph extends Graph {
	int[]	wt;			///< array of edge weights

	/** Construct Graph with space for a specified # of vertices and edges.
	 *  @param N1 is number of vertices in the graph
	 *  @param maxEdge1 is the maximum number of edges
	 */
	public Wgraph(int N, int maxEdge) {
		super(N,maxEdge); makeSpace(N,maxEdge);
	}

	/** Allocate and initialize dynamic storage for graph.
	 */
	public void makeSpace(int numv, int maxe) {
	        wt = new int[maxe+1];
		for (int e = 0; e <= maxe; e++) wt[e] = 0;
	}
	
	public void resize(int numv, int maxe) {
		super.resize(numv, maxe);
		makeSpace(numv, maxe);
	}

	/** Get the weight of an edge.
	 *  @param e is the edge of interest
	 *  @return the weight of e, or 0 if e is not a valid edge.
	 */
	public int weight(int e) {
		assert(0 <= e && e <= maxEdge);
		return (left(e) == 0 ? 0 : wt[e]);
	}
	
	/** Set the weight of an edge.
	 *  @param e is the edge of interest
	 *  @param wt is the desired weight
	 */
	public void setWeight(int e, int w) {
		assert(0 <= e && e <= maxEdge);
		wt[e] = w;
	}

	/** Assign edges a random weight in given range.
	 *  @param lo is the low end of the range
	 *  @param hi is the high end of the range
	 */
	public void randWeight(int lo, int hi) {
	        for (int e = first(); e != 0; e = next(e))
			setWeight(e,Util.randint(lo,hi));
	}

	/** Copy another Graph to this one.
	 *  @param original is another graph that is to replace this one.
	 */
	public void copyFrom(Wgraph original) {
		if (N != original.n() || maxEdge < original.m()) {
			resize(original.n(), original.m());
		} else {
			reset();
		}
		N = original.n();
		for (int e = original.first(); e != 0; e = original.next(e)) {
			int ee = join(original.left(e),original.right(e));
			setWeight(ee,original.weight(e));
		}
		sortAdjLists();
	}

	/** Read one edge from an input stream, add it to the graph.
	 *  Since for undirected graphs, edges appear on both adjacency lists,
	 *  ignore an edge if its second vertex is larger than the first.
	 *  @param in is an open input stream
	 *  @return true on success, false on error.
	 */
	public boolean readEdge(PushbackReader in) {
	        int u, v; Util.MutableInt w = new Util.MutableInt();
	        if (!Util.verify(in,'(') || (u = Util.readNode(in,n())) == 0 ||
	            !Util.verify(in,',') || (v = Util.readNode(in,n())) == 0 ||
	            !Util.verify(in,',') || !Util.readNum(in,w) ||
		    !Util.verify(in,')'))
	                return false;
	        if (u < 1 || u > n() || v < 1 || v > n()) return false;
		int e;
	        if (u < v) { e = join(u,v); setWeight(e,w.val); }
	
	        return true;
	}
	
	/** Create a string representation of an edge.
	 *  In the returned string, the "left" endpoint of the edge appears
	 *  first.
	 *  @param e is an edge number
	 *  @return the string representing the edge
	 */
	public String edge2string(int e) {
	        String s = "(";
	        int u = left(e); int v = right(e);
	        s += Util.node2string(u,n()) + ",";
	        s += Util.node2string(v,n()) + ",";
		s += wt[e] + ")";
	        return s;
	}
	
	/** Create a string representation of an edge.
	 *  @param e is an edge number
	 *  @param u is one of the endponts of e; it will appear first in
	 *  the string
	 *  @return the string representing the edge
	 */
	public String edge2string(int e, int u) {
	        String s = "(";
	        int v = mate(u,e);
	        s += Util.node2string(u,n()) + ",";
	        s += Util.node2string(v,n()) + ",";
		s += wt[e] + ")";
	        return s;
	}
}
