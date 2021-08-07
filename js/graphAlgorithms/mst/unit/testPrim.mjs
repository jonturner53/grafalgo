/** \file TestMst.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import java.util.ArrayList;
import grafalgo.misc.Util;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.List;
import grafalgo.dataStructures.heaps.Heap_d;
import grafalgo.dataStructures.graphs.Graph_w;
import grafalgo.graphAlgorithms.mst.Mst;

public final class testMst {
	/**
	 *  Unit test for List data structure.
	 *
	 *  usage: testMst algorithm
	 *
	 *  where algorithm is "prim", "kruskal" or "cheriton"
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests(args)) System.out.println("basic tests passed");
	
		// add more systematic tests for each individual method
	}

	private static String gstring =
		"{\n[a| b:3 d:2 e:5]\n[b| a:3 c:7 f:4]\n[c| b:7 d:1 f:2]\n" +
		"[d| a:2 c:1 e:3]\n[e| a:5 d:3 f:1]\n[f| b:4 c:2]\n}\n";

	public static boolean basicTests(String[] args) {
		int n = 6; List l1 = new List(n);
		Scanner in = new Scanner(gstring);
		Graph_w g = new Graph_w(n);
		g.read(in);
		Mst mst = new Mst();

		if (args[0].equals("prim")) {
			ArrayList<Integer> tree = mst.prim(g);
			g.assertEqual(g.elist2string(tree),
						  "[(a,d,2) (c,d,1) (c,f,2) (e,f,1) (a,b,3)]", "a1");
			g.assertEqual(mst.check(g, tree), "ok", "a2");
			tree.remove(4);
			g.assertEqual(mst.check(g, tree), "Mst.check: size error", "a3");
			tree.add(g.findEdge(1, 2));
			g.assertEqual(mst.check(g, tree), "ok", "a4");
			int e = g.join(2, 4); g.setWeight(e, 1);
			g.assertEqual(mst.check(g, tree),
						  "Mst.check: cheap cross-edge 10=(b,d,1) in g", "a5");
			e = g.join(3, 10); g.setWeight(e, 2);
			e = g.join(6, 10); g.setWeight(e, 5);
			e = g.join(6, 7); g.setWeight(e, 2);
			e = g.join(3, 8); g.setWeight(e, 6);
			e = g.join(2, 9); g.setWeight(e, 1);
			e = g.join(9, 10); g.setWeight(e, 1);
			tree = mst.prim(g);
			g.assertEqual(g.elist2string(tree),
						  "[(a,d,2) (b,d,1) (c,d,1) (b,i,1) (i,j,1) (c,f,2) " +
						  "(e,f,1) (f,g,2) (c,h,6)]", "a6");
			g.assertEqual(mst.check(g, tree), "ok", "a7");
		} else {
			Util.fatal("unrecognized algorithm: " + args[0]);
		}
		
		return true;
	}
}
