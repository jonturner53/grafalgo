/** \file TestGraph.java
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
import grafalgo.dataStructures.graphs.Graph;

public final class testGraph {
	public static boolean basicTests() {
		int n = 8; int nMax = 12; int mMax = 30;
		Graph g = new Graph(n, nMax, mMax);

		g.assertEqual(g.n(), 8, "a1");
		g.assertEqual(g.m(), 0, "a2");
		g.assertEqual("{\n[a|]\n[b|]\n[c|]\n[d|]\n" +
					  "[e|]\n[f|]\n[g|]\n[h|]\n}\n", "a3");
		g.join(1, 4); g.join(1, 3); g.join(2, 4); g.join(3, 5);
		g.assertEqual("{\n[a| d c]\n[b| d]\n[c| a e]\n[d| a b]\n" +
					  "[e| c]\n[f|]\n[g|]\n[h|]\n}\n", "a4");
		g.join(5, 1); g.join(2, 7); g.join(3, 7);
		g.assertEqual("{\n[a| d c e]\n[b| d g]\n[c| a e g]\n[d| a b]\n" +
					  "[e| c a]\n[f|]\n[g| b c]\n[h|]\n}\n", "a5");
		ArrayList<Integer> elist = new ArrayList<Integer>();
		elist.add(g.join(5, 9));
		elist.add(g.join(7, 8));
		elist.add(g.join(9, 4)); 
		g.assertEqual("{\n[a| d c e]\n[b| d g]\n[c| a e g]\n[d| a b i]\n" +
					  "[e| c a i]\n[f|]\n[g| b c h]\n[h| g]\n[i| e d]\n}\n",
					  "a6");
		g.delete(g.findEdge(1, 3)); g.delete(g.findEdge(4, 2));
		g.assertEqual("{\n[a| d e]\n[b| g]\n[c| e g]\n[d| a i]\n" +
					  "[e| c a i]\n[f|]\n[g| b c h]\n[h| g]\n[i| e d]\n}\n",
					  "a7");
		g.assertEqual(g.degree(1), 2, "a8");
		g.assertEqual(g.degree(2), 1, "a80");
		g.assertEqual(g.degree(6), 0, "a81");
		g.assertEqual(g.degree(7), 3, "a82");
		g.assertEqual(g.maxDegree(), 3, "a83");
		g.assertEqual(g.elist2string(elist), "[(e,i) (g,h) (i,d)]", "a9");

		Graph g2 = new Graph(); g2.assign(g);
		g.assertTrue(!(g.toString().equals(g2.toString())), "b1");
		g.assertEqual(g2, "b2");
		g.assertEqual("{\n[a| d e]\n[b| g]\n[c| e g]\n[d| a i]\n" +
					  "[e| a c i]\n[f|]\n[g| b c h]\n[h| g]\n[i| d e]\n}\n",
					  "b3");
		g2.clear();
		g2.assertEqual("{\n[a|]\n[b|]\n[c|]\n[d|]\n" +
					  "[e|]\n[f|]\n[g|]\n[h|]\n[i|]\n}\n", g2.m(), 0, "b4");

		Scanner in = new Scanner("{\n[a| d b]\n[b| a c]\n[c| b d]\n" +
								 "[d| a c]\n}\n");
		g.reset(4, 10, 10); g.read(in);
		g.assertEqual("{\n[a| b d]\n[b| a c]\n[c| b d]\n[d| a c]\n}\n", "c1");

		return true;
	}
	
	/**
	 *  Unit test for Graph data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	
		// add more systematic tests for each individual method
	}
}
