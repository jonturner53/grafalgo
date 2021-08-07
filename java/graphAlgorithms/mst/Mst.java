package grafalgo.graphAlgorithms.mst;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import grafalgo.misc.Util;
import grafalgo.dataStructures.basic.List;
import grafalgo.dataStructures.basic.Dlists;
import grafalgo.dataStructures.basic.Dsets;
import grafalgo.dataStructures.heaps.Heap_d;
import grafalgo.dataStructures.graphs.Graph_w;

/** Class that defines minimum spanning tree algorithms. */
public class Mst {
	/** Find a minimum spanning tree of g using Prim's algorithm.
	 *  @param g is a weighted graph
	 *  @return an ArrayList containing the edges in the mst.
	 */
	public ArrayList<Integer> prim(Graph_w g) {
		ArrayList<Integer> tree = new ArrayList<Integer>(g.n());
		int[] cheap = new int[g.n()+1]; Arrays.fill(cheap, 0);
		Heap_d nheap = new Heap_d(g.n(), 2+g.m()/g.n());
	
		for (int e = g.firstAt(1); e != 0; e = g.nextAt(1,e)) {
			int u = g.mate(1,e); nheap.insert(u, g.weight(e)); cheap[u] = e;
		}
		cheap[1] = 1;	// dummy value, any non-zero value will do
		while (!nheap.empty()) {
			int u = nheap.deletemin(); tree.add(cheap[u]);
			for (int e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
				int v = g.mate(u,e);
				if (nheap.member(v) && g.weight(e) < nheap.key(v)) {
					nheap.changekey(v, g.weight(e)); cheap[v] = e;
				} else if (!nheap.member(v) && cheap[v] == 0) {
					nheap.insert(v, g.weight(e)); cheap[v] = e;
				}
			}
		}
		return tree;
	}

	/** Find a minimum spanning tree of g using Kruskal's algorithm.
	 *  @param g is a weighted graph
	 *  @return an ArrayList containing the edges in the mst.
	 */
	public ArrayList<Integer> kruskal(final Graph_w g) {
		ArrayList<Integer> tree = new ArrayList<Integer>(g.n());
		Dsets subtrees = new Dsets(g.n());

		int i = 0; Integer[] elist = new Integer[g.m()];
		for (int e = g.first(); e != 0; e = g.next(e)) elist[i++] = e;

		class EdgeCompare implements Comparator<Integer> {
			public int compare(Integer e1, Integer e2) {
				return g.weight(e1) - g.weight(e2);
			}
		}
		Arrays.sort(elist, new EdgeCompare());

		//sortEdges(g,elist);

		for (int i = 0; i < elist.length; i++) {
			int e = elist[i];
			int u = g.left(e); int v = g.right(e);
			int cu = subtrees.find(u); int cv = subtrees.find(v);
			if (cu != cv) {
				 subtrees.link(cu, cv); mst.add(e);
			}
		}
		return tree;
	}
	
	/** Check the correctness of an mst.
	 *  @param g is a weighted graph object
	 *  @param tree is a list of the edges in the mst.
	 *  @return "ok" if tree is a valid mst, otherwise return an error message
	 */
	public String check(Graph_w g, ArrayList<Integer> tree) {
		// first construct a graph version of the tree
		Graph_w tg = new Graph_w(g.n(), g.n(), g.n()-1);
		for (int i = 0; i < tree.size(); i++) {
			int e = tree.get(i);
			int ee = tg.join(g.left(e), g.right(e));
			tg.setWeight(ee, g.weight(e));
		}

		// check that tg is a subgraph of g
		if (tg.n() != g.n() || tg.m() != tg.n()-1) {
			return String.format("Mst.check: size error");
		}
		int[] edgeTo = new int[tg.n()+1];
		for (int u = 1; u <= g.n(); u++) edgeTo[u] = 0;
		for (int u = 1; u <= g.n(); u++) {
			for (int e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
				edgeTo[g.mate(u, e)] = e;
			for (int f = tg.firstAt(u); f != 0; f = tg.nextAt(u, f)) {
				int v = tg.mate(u, f);
				int e = edgeTo[v];
				if (e == 0 || tg.weight(f) != g.weight(e)) {
					return String.format("Mst.check: edge %d=%s is not in g",
									  	 f, tg.edge2string(f));
				}
			}
			for (int e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
				edgeTo[g.mate(u, e)] = 0;
		}
	
		// check that tg reaches all the vertices
		boolean mark[] = new boolean[tg.n()+1]; int marked;
		for (int u = 1; u <= tg.n(); u++) mark[u] = false;
		mark[1] = true; marked = 1;
		List q = new List(g.n()); q.enq(1);
		while (!q.empty()) {
			int u = q.deq();
			for (int e = tg.firstAt(u); e != 0; e = tg.nextAt(u, e)) {
				int v = tg.mate(u, e);
				if (!mark[v]) {
					q.enq(v); mark[v] = true; marked++;
				}
			}
		}
		if (marked != tg.n()) {
			return String.format("Mst.check: tree does not reach all " +
								 "vertices");
		}
		// check that there is no cheaper spanning tree
		return verify(g, tg);
	}
	
	/** Verify that there is no cheaper spanning tree.
	 *  Print an error message for each discrepancy found.
	 *  @param g is a weighted graph
	 *  @param tg is a second graph that is assumed to be a spanning tree.
	 *  @return "ok" if tg is a valid mst, else an error message
	 */
	private String verify(Graph_w g, Graph_w tg) {
		// Determine nearest common ancestor for each edge.
		int[] first_edge = new int[g.n()+1];
		Dlists edge_sets = new Dlists(g.m());
		nca(g, tg, first_edge, edge_sets);
	
		// Check paths from endpoints to nca, and compress.
		int[] a = new int[tg.n()+1];	// a[u] is an ancestor of u
		int[] mw = new int[tg.n()+1];	// mw[u] is max edge wt between u, a[u]
		return rverify(g, tg, 1, 1, first_edge, edge_sets, a, mw);
	}

	/** Recursively verify a subtree
	 *  @param g is the graph
	 *  @param tg is the candidate MST
	 *  @param u is a vertex
	 *  @param pu is the parent of u in tg
	 *  @param first_edge[u] is the first edge of a list in edge_sets for
	 *  which u is the nearest comman ancestor in tg
	 *  @param edge_sets partitions the edges into subsets that all
	 *  share a nearest common ancestor in tg
	 *  @param a[u] is an ancestor of vertex u in tg
	 *  @return "ok" if the tree is a valid mst, else an error message
	 */
	private String rverify(Graph_w g, Graph_w tg, int u, int pu,
		     		int[] first_edge, Dlists edge_sets, int[] a, int[] mw) {
		for (int e = tg.firstAt(u); e != 0; e = tg.nextAt(u, e)) {
			int v = tg.mate(u, e);
			if (v == pu) continue;
			a[v] = u; mw[v] = tg.weight(e);
			String s = rverify(g, tg, v, u, first_edge, edge_sets, a, mw);
			if (!s.equals("ok")) return s;
		}
		int e = first_edge[u];
		if (e == 0) return "ok";
		while (true) {
			int m = Math.max( max_wt(g.left(e), u, a, mw),
				 			  max_wt(g.right(e), u, a, mw) );
			if (m > g.weight(e)) {
				return String.format("Mst.check: cheap cross-edge %d=%s in g",
				     			  	 e, g.edge2string(e));
			}
			e = edge_sets.next(e);
			if (e == 0) break;
		}
		return "ok";
	}
	
	/** Return the maximum weight of edges on a path.
	 *  Performs path compression as a side-effect.
	 *  @param u is a vertex
	 *  @param v is an ancestor of u
	 *  @param a contains ancestor pointers used to speed path searches
	 *  @param mw[x] is the maximum weight on the path from a vertex x
	 *  to its ancestor a[x]
	 */
	private int max_wt(int u, int v, int[] a, int[] mw) {
		if (u == v) return 0;
		int m = Math.max(mw[u], max_wt(a[u], v, a, mw));
		a[u] = v; mw[u] = m;
		return m;
	}
			
	/** Compute nearest common ancestors of edge endpoints.
	 *  @param g is the graph
	 *  @param tg is the candidate MST
	 *  @param first_edge[u] is an edge for which u is the nearest common
	 *  ancestor, or 0 if there is no such edge
	 *  @param edge_sets is used to return a collection of lists that partition
	 *  the edges; two edges appear on the same list if they have the same nca
	 */
	private void nca(Graph_w g, Graph_w tg, int[] first_edge,
				     Dlists edge_sets) {
		Dsets npap = new Dsets(g.n());
		int[] npa = new int[g.n()+1];
		boolean[] mark = new boolean[g.m()+1];
	
		for (int e = g.first(); e != 0; e = g.next(e)) mark[e] = false;
		for (int u = 1; u <= g.n(); u++) {
			first_edge[u] = 0; npa[u] = u;
		}
		nca_search(g, tg, 1, 1, first_edge, edge_sets, npap, npa, mark);
	}
	
	/** Recursive helper for computing nearest common ancestors of endpoints.
	 *  @param g is the graph
	 *  @param tg is the candidate MST
	 *  @param u is a vertex
	 *  @param pu is the parent of u
	 *  @param first_edge[u] is an edge for which u is the nca,
	 *  or 0 if there is no such edge
	 *  @param edge_sets is used to return a collection of lists that partition
	 *  the edges; two edges appear on the same list if they have the same nca
	 */
	private void nca_search(Graph_w g, Graph_w tg, int u, int pu,
			int[] first_edge, Dlists edge_sets, Dsets npap,
			int[] npa, boolean[] mark) {
		for (int e = tg.firstAt(u); e != 0; e = tg.nextAt(u, e)) {
			int v = tg.mate(u, e);
			if (v == pu) continue;
			nca_search(g, tg, v, u, first_edge, edge_sets, npap, npa, mark);
			npap.link(npap.find(u), npap.find(v));
			npa[npap.find(u)] = u;
		}
		for (int e = g.firstAt(u); e != 0; e = g.nextAt(u, e)) {
			int v = g.mate(u, e);
			if (!mark[e]) mark[e] = true;
			else {
				int w = npa[npap.find(v)];
				first_edge[w] = edge_sets.join(e, first_edge[w]);
			}
		}
	}
}
