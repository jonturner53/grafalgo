// usage:
//	MstRep method reps n m maxkey
//
// mstRep repeatedly generates a random graph and computes
// its minimum spanning tree using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, m is the number of edges,
// maxkey is the maximum key
//

package algoLib.graphAlgorithms.mst;
import algoLib.misc.*;
import algoLib.dataStructures.graphs.*;
import java.io.*;

public class MstRep {
	public static void main(String [] args) {
		String gtyp = "graph";
		int reps = 1; int n = 10; int m = 20; int maxkey = 100;
		try {
			gtyp = args[0];
			reps = Integer.parseInt(args[1]);
			n = Integer.parseInt(args[2]);
			m = Integer.parseInt(args[3]);
			maxkey = Integer.parseInt(args[4]);
		} catch(Exception e) {
			Util.fatal("usage: MstRep method reps n m maxkey");
		}
	
		Wgraph wg = new Wgraph(n,m);
		Wgraph mstree = new Wgraph(n,n-1);

		long t1 = 0; long t2;
		long mintime = Long.MAX_VALUE;
		long maxtime = 0;
		long totaltime = 0;
		Util.setSeed(1);
		for (int i = 0; i <= reps; i++) {
			wg.rcgraph(n,m); 
			wg.randWeight(0,maxkey);
			mstree.reset();
			//mstree = new Wgraph(n,n-1);
	
			if (gtyp.equals("prim")) {
				t1 = System.nanoTime();
				Prim.algo(wg,mstree);
/*
			else if (gtyp.equals("kruskal")) {
				t1 = System.nanoTime();
				kruskal(wg,mstree);
			} else if (gtyp.equals("primF")) {
				t1 = System.nanoTime();
				primF(wg,mstree);
			} else if (gtyp.equals("rrobin")) {
				t1 = System.nanoTime();
				rrobin(wg,mstree);
*/
			} else {
				Util.fatal("mstRep: undefined method");
			}
			t2 = System.nanoTime();

			if (i == 0) continue;
			long diff = t2 - t1; diff /= 1000;
			mintime = Math.min(diff,mintime);
			maxtime = Math.max(diff,maxtime);
			totaltime += diff;
		}
		double avgtime = ((double) totaltime/reps);
		System.out.print("avgTime=" + avgtime + " us  ");
		System.out.print("minTime=" + mintime + " us  ");
		System.out.print("maxTime=" + maxtime + " us\n");
	}
}
