/** \file TestListPair.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.ListPair;

public final class testListPair {
	public static boolean basicTests() {
		int n = 8; ListPair lp = new ListPair(n);

		lp.assertEqual(lp.n(), n, "a1");
		lp.assertEqual(lp.firstIn(), 0, "a2");
		lp.assertEqual(lp.lastIn(), 0, "a3");
		lp.assertEqual(lp.firstOut(), 1, "a4");
		lp.assertEqual(lp.lastOut(), n, "a5");
		lp.assertEqual(lp.nIn(), 0, "a6");
		lp.assertEqual(lp.nOut(), n, "a7");
		lp.assertEqual("[ : a b c d e f g h]", "a8");

		lp.swap(4); lp.swap(2);
		lp.assertEqual("[d b : a c e f g h]", "b1");
		lp.swap(6, 4); lp.swap(8, 0);
		lp.assertEqual("[h d f b : a c e g]", "b2");

		Scanner in = new Scanner("[h g f : d b a c e]");
		lp.read(in);
		lp.assertEqual("[h g f : d b a c e]", "c1");
		lp.expand(9);
		lp.assertEqual(lp.n(), 9, "c2");
		lp.assertEqual("[h g f : d b a c e i]", "c3");

		return true;
	}
	
	/**
	 *  Unit test for ListPair data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	}
}
