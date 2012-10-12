// usage: mst method
//
// mst reads a graph from stdin, computes its minimum spanning tree
// using the method specified by the argument and then prints the graph
// and the mst.
//

package algoLib.graphAlgorithms.mst;
import algoLib.misc.*;
import algoLib.dataStructures.graphs.*;
import java.io.*;

public class Mst {
	public static void main(String [] args) {
		Wgraph wg = new Wgraph(10,10);
		PushbackReader in = new PushbackReader(
					new InputStreamReader(System.in));
		wg.read(in);
		Wgraph mstree = new Wgraph(wg.n(),wg.n()-1);
		
		if (args.length < 1) Util.fatal("usage: mst method ..");
	
		long t1 = System.nanoTime();
		if (args[0].equals("prim"))
			Prim.algo(wg,mstree);
		/*
		else if (args[0].equals("kruskal")) 
			Kruskal(wg,mstree);
		else if (args[0].equals("primF"))
			PrimF(wg,mstree);
		else if (args[0].equals("rrobin"))
			Rrobin(wg,mstree);
		*/
		else
			Util.fatal("mst: undefined method");
		long t2 = System.nanoTime();
	
		System.out.println(wg.toString() + "\n" + mstree.toString());
		int cost = 0;
		for (int e = mstree.first(); e != 0; e = mstree.next(e))
			cost += mstree.weight(e);
		System.out.println("\ntree cost: " + cost);
		System.out.println("\nelapsed time: " + (t2-t1)/1000 + " us");
	}
}
