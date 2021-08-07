/** \file TestGraph_w.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import java.util.ArrayList;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.graphs.Graph_w;

public final class testGraph_w {
	public static boolean basicTests() {
		int n = 8; int nMax = 12; int mMax = 30;
		Graph_w g = new Graph_w(n, nMax, mMax);

		g.join(1, 4); g.join(1, 3); g.join(2, 4); g.join(3, 5);
		g.setWeight(g.findEdge(1,4), 7);
		g.setWeight(g.findEdge(3,5), 8);
		g.assertEqual("{\n[a| d:7 c:0]\n[b| d:0]\n[c| a:0 e:8]\n" + 
					  "[d| a:7 b:0]\n[e| c:8]\n[f|]\n[g|]\n[h|]\n}\n", "a4");


		Scanner in = new Scanner("{\n[a| d:1 b:2 ]\n[b| a:2 c:3]\n" +
								 "[c| b:3 d:4]\n[d| a:1 c:4]\n}\n");
		g.reset(4, 10, 10); g.read(in);
		g.assertEqual("{\n[a| b:2 d:1]\n[b| a:2 c:3]\n" +
					  "[c| b:3 d:4]\n[d| a:1 c:4]\n}\n", "c1");

		return true;
	}
	
	/**
	 *  Unit test for Graph_w data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	
		// add more systematic tests for each individual method
	}
}
