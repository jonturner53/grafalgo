/** @file testDsets.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import grafalgo.misc.Util;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.Dsets;

public final class testDsets {
    public static boolean basicTests() {
        int n = 10; Dsets ds = new Dsets(n);

		//ds.assertEqual("{a b c d e f g h i j}", "a1");
		ds.link(1, 3);
		ds.assertEqual("{(a c) b d e f g h i j}", "a2");
		ds.link(4, 5); ds.link(2, 4);
		ds.assertEqual("{(a c) (d b e) f g h i j}", "a3");
		ds.link(6, 7); ds.link(8, 9); ds.link(8, 10);
		ds.assertEqual("{(a c) (d b e) (f g) (h i j)}", "a4");
		ds.assertEqualLong("{a.1(c) d.1(b e) f.1(g) h.1(i j)}", "a5");
		ds.link(1, 4); ds.link(6, 8);
		ds.assertEqual("{(a b c d e) (f g h i j)}", "a6");
		ds.link(1, 6);
		ds.assertEqual("{(a b c d e f g h i j)}", "a7");
		ds.assertEqualLong("{a.3(c d(b e) f(g h(i j)))}", "a5");
		int r = ds.find(10);
		ds.assertEqualLong("{a.3(c d(b e) f(g) h(i) j)}", r, 1, "a8");
		r = ds.find(2);
		ds.assertEqualLong("{a.3(b c d(e) f(g) h(i) j)}", r, 1, "a9");
		return true;
	}

	/**
	 *  Unit test for Dsets data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		basicTests();
		System.out.println("basic tests passed");
	}
}
