/** \file TestDlists.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.Dlists;

public final class testDlists {
	public static boolean basicTests() {
		int n = 8; Dlists dl = new Dlists(n);

		dl.assertEqual(dl.n(), n, "a1");
		for (int i = 1; i <= n; i++)
			dl.assertTrue(dl.singleton(i), "a2 " + i);
		dl.assertEqual("[(a), (b), (c), (d), (e), (f), (g), (h)]", "a3");

		dl.join(1, 3); dl.join(5, 6); dl.join(2, 7);
		dl.assertEqual("[(a c), (b g), (d), (e f), (h)]", "b1");
		int v = dl.join(1, 5);
		dl.assertEqual("[(a c e f), (b g), (d), (h)]", v, 1, "b2");
		dl.assertEqual(dl.first(1), 1, "b3");
		dl.assertEqual(dl.last(1), 6, "b4");
		dl.assertEqual(dl.next(1), 3, "b5");
		dl.assertEqual(dl.prev(5), 3, "b6");
		dl.delete(5, 1); 
		dl.assertEqual("[(a c f), (b g), (d), (e), (h)]", "b7");
		dl.delete(1, 1); dl.delete(7, 2);
		dl.assertEqual("[(a), (b), (c f), (d), (e), (g), (h)]", "b8");
		dl.assertTrue(!dl.singleton(6), "b9");
		dl.assertTrue(dl.singleton(7), "b10");
		dl.clear(); 
		dl.assertEqual("[(a), (b), (c), (d), (e), (f), (g), (h)]", "b11");

		Scanner in = new Scanner("[(d i h k), (e a  c), (g b l ), (j f)]");
		dl.read(in);
		dl.assertEqual("[(d i h k), (e a c), (g b l), (j f)]", "c1");
		dl.assertEqual(dl.n(), 12, "c2");

		return true;
	}
	
	/**
	 *  Unit test for Dlists data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	}
}
