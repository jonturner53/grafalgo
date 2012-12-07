// usage: rgraph type n m scram [..] seed
//
// Create a random graph on n vertices and m edges
// and print it. Type specifies what type of graph
// to generate (see below). Span is the max separation
// between vertices in the same edge. Scramble=1 if
// vertex numbers should be randomized, otherwise 0.
// Certain cases require additional arguments that are detailed
// below, along with the string that specifies the
// graph type.
// 
//     "graph"  n m scram seed
//   "bigraph"  n m scram seed
//    "cgraph"  n m scram seed
//      "tree"  n m scram seed
//    "wgraph" 	n m scram lo hi seed
//  "wbigraph"  n m scram lo hi seed
//   "wcgraph"  n m scram lo hi seed
//     "wtree"  n m scram seed
//   "digraph"  n m scram seed
//       "dag"  n m scram seed
//  "wdigraph" 	n m scram lo hi seed
//      "wdag" 	n m scram lo hi seed
//  "flograph"  n m scram mss ecap1 ecap2 seed
// "wflograph" 	n m scram mss ecap1 ecap2 lo hi seed
// "mflograph" 	n m scram mss ecap1 ecap2 lo hi seed
//
// For bigraphs, n is the number of vertices in each part.
// For weighted graphs, [lo,hi] is the range of edge
// weights. These are distributed uniformly in the range.
// For flographs, mss is the number of edges from the source
// and to the sink, ecap1 is the average edge capacity of
// source/sink edges and ecap2 is the average edge capacity
// of all other edges.

package algoLib.graphAlgorithms.misc;

import algoLib.misc.Util;
import algoLib.dataStructures.graphs.Graph;
import algoLib.dataStructures.graphs.Wgraph;

public class rgraph {
	public static void main(String [] args) {
		int n = 10; int m = 20; int mss = 3; int scram = 0;
		int lo = 0; int hi = 9; int ecap1 = 10; int  ecap2 = 4;
		long seed = 1;
		String gtyp = args[0];
	
		try {
		    	n = Integer.parseInt(args[1]);
		    	m = Integer.parseInt(args[2]);
		    	scram = Integer.parseInt(args[3]);
		    	lo = Integer.parseInt(args[args.length-3]);
		    	hi = Integer.parseInt(args[args.length-2]);
		    	seed = Integer.parseInt(args[args.length-1]);
			if (args.length >= 7) {
			    	mss = Integer.parseInt(args[4]);
		    		ecap1 = Integer.parseInt(args[5]);
		    		ecap1 = Integer.parseInt(args[6]);
			}
		} catch (Exception e) {
			Util.fatal("usage: rgraph type n m scram [..] seed");
		}
	
		Util.setSeed(seed); 
		if (gtyp.equals("graph") && args.length == 5) {
			Graph g = new Graph(n,m);
			g.rgraph(n,m);
			if (scram != 0) g.scramble();
			System.out.println("" + g);
		} else if (gtyp.equals("bigraph") && args.length == 5) {
			Graph bg = new Graph(2*n,m);
			bg.rbigraph(n,m);
			if (scram != 0) bg.scramble();
			System.out.println("" + bg);
		} else if (gtyp.equals("cgraph") && args.length == 5) {
			Graph cg = new Graph(n,m);
			cg.rcgraph(n,m);
			if (scram != 0) cg.scramble();
			System.out.println("" + cg);
		} else if (gtyp.equals("tree") && args.length == 5) {
			Graph tree = new Graph(n,n-1);
			tree.rtree(n);
			if (scram != 0) tree.scramble();
			System.out.println("" + tree);
		} else if (gtyp.equals("wgraph") && args.length == 7) {
			Wgraph wg = new Wgraph(n,n-1);
			wg.rtree(n);
			wg.randWeight(lo,hi);
			if (scram != 0) wg.scramble();
			System.out.println("" + wg);
		} else if (gtyp.equals("wbigraph") && args.length == 7) {
			Wgraph wbg = new Wgraph(2*n,m);
			wbg.rbigraph(n,m);
			wbg.randWeight(lo,hi);
			if (scram != 0) wbg.scramble();
			System.out.println("" + wbg);
		} else if (gtyp.equals("wcgraph") && args.length == 7) {
			Wgraph wcg = new Wgraph(n,m);
			wcg.rcgraph(n,m);
			wcg.randWeight(lo,hi);
			if (scram != 0) wcg.scramble();
			System.out.println("" + wcg);
/*
		} else if (strcmp(gtyp,"wtree") == 0 && args.length == 7) {
			Wgraph wtree(n,n-1);
			wtree.rtree(n);
			wtree.randWeight(lo,hi);
			if (scram) wtree.scramble();
			cout << wtree.toString(s);
		} else if (strcmp(gtyp,"digraph") == 0 && args.length == 5) {
			Digraph dg(n,m);
			dg.rgraph(n,m);
			if (scram) dg.scramble();
			cout << dg.toString(s);
		} else if (strcmp(gtyp,"dag") == 0 && args.length == 5) {
			Digraph dag(n,m);
			dag.rdag(n,m);
			if (scram) dag.scramble();
			cout << dag.toString(s);
		} else if (strcmp(gtyp,"wdigraph") == 0 && args.length == 7) {
			Wdigraph wD(n,m);
			wD.rgraph(n,m);
			wD.randLength(lo,hi);
			if (scram) wD.scramble();
			cout << wD.toString(s);
		} else if (strcmp(gtyp,"wdag") == 0 && args.length == 7) {
			Wdigraph waD(n,m);
			waD.rdag(n,m);
			waD.randLength(lo,hi);
			if (scram) waD.scramble();
			cout << waD.toString(s);
		} else if (strcmp(gtyp,"flograph") == 0 && args.length == 9) {
			Flograph fg(n,m,1,2);
			fg.rgraph(n,m,mss);
			fg.randCapacity(ecap1,ecap2);
			if (scram) fg.scramble();
			cout << fg.toString(s);
		} else if (strcmp(gtyp,"wflograph") == 0 && args.length == 11) {
			Wflograph wfg(n,m,1,2);
			wfg.rgraph(n,m,mss);
			wfg.randCapacity(ecap1,ecap2);
			wfg.randCost(lo,hi);
			if (scram) wfg.scramble();
			cout << wfg.toString(s);
		} else if (strcmp(gtyp,"mflograph") == 0 && args.length == 11) {
			Mflograph mfg(n,m,1,2);
			mfg.rgraph(n,m,mss);
			mfg.randCapacity(ecap1,ecap2);
			mfg.randMinFlo(lo,hi);
			if (scram) mfg.scramble();
			cout << mfg.toString(s);
*/
		} else 
			Util.fatal("usage: rgraph type n m scram [..] seed");
	}
}
