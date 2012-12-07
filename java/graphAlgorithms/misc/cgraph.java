// usage: cgraph type
//
// Copy a graph of specified type from stdin to stdout.
// Why you ask? To test input and output methods, of course.
//
// The allowed values of type are graph, wgraph,
// digraph, wdigraph, flograph, wflograph.

package algoLib.graphAlgorithms.misc;

import algoLib.misc.Util;
import algoLib.dataStructures.graphs.Graph;
import algoLib.dataStructures.graphs.Wgraph;

import java.io.*;

public class cgraph {
	public static void main(String [] args) {
		if (args.length != 1)
			Util.fatal("usage: cgraph type");

		PushbackReader in = new PushbackReader(
				    new InputStreamReader(System.in));
	
		if (args[0].equals("graph")) {
			Graph g = new Graph(1,1); g.read(in);
			System.out.println("" + g);
		} else if (args[0].equals("wgraph")) {
			Wgraph wg = new Wgraph(1,1); wg.read(in);
			System.out.println("" + wg);
/*
		} else if (args[0].equals("digraph")) {
			Digraph dg = new Digraph(1,1); dg.read(in);
			System.out.println("" + dg);
		} else if (args[0].equals("wdigraph")) {
			Digraph wdg = new Digraph(1,1); wdg.read(in);
			System.out.println("" + wdg);
		} else if (args[0].equals("flograph")) {
			Flograph fg = new Flograph(1,1); fg.read(in);
			System.out.println("" + fg);
		} else if (args[0].equals("wflograph")) {
			Flograph wfg = new Flograph(1,1); wfg.read(in);
			System.out.println("" + wfg);
*/
		} else {
			Util.fatal("usage: cgraph type");
		}
	}
}
