/** \file TestList_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import grafalgo.misc.Util;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.List_d;

public final class testList_d {
	public static boolean basicTests() {
		int n1 = 10; List_d l1 = new List_d(n1);

		l1.assertEqual(l1.n(), 10, "a1");
	
		l1.assertTrue(l1.empty(), "a2");
		l1.assertConsistent("a3");
	
		for (int i = 1; i <= n1; i++)
			l1.assertTrue(!l1.member(i), "a4 " + i);
	
		l1.insert(1, 0); l1.assertEqual("[a]", "b1");
		l1.assertConsistent("b2");
		l1.assertTrue(!l1.empty(),"b3");
		l1.assertTrue(l1.member(1),"b4");
	
		for (int i = 3; i <= n1; i += 2) l1.enq(i);
		l1.assertEqual("[a c e g i]", "c1");
		l1.assertConsistent("c2");
		l1.assertTrue(l1.member(5), "c3");
		l1.assertTrue(!l1.member(4), "c4");
		l1.assertEqual(l1.prev(9), 7, "c5");
		l1.assertEqual(l1.prev(7), 5, "c6");
		l1.assertEqual(l1.prev(5), 3, "c7");
		l1.assertEqual(l1.prev(1), 0, "c8");
	
		int v = l1.pop(); l1.assertEqual("[c e g i]", v, 1, "d1");
		l1.assertConsistent("d2");
		l1.assertTrue(!l1.member(1), "d3");
		l1.insert(8, 5); l1.assertEqual("[c e h g i]", "d4");
		l1.delete(7); l1.assertEqual("[c e h i]", "d5");
		l1.delete(9); l1.assertEqual("[c e h]", "d6");
		l1.delete(3); l1.assertEqual("[e h]", "d7");
		l1.push(4); l1.assertEqual("[d e h]", "d8");
		l1.deq(); l1.assertEqual("[e h]", "d9");
		l1.assertConsistent("d10");
		l1.assertTrue(!l1.empty(), "d11");
	
		int n2 = 27; List_d l2 = new List_d(n2);
		l2.push(1); l2.push(2); l2.push(3);
		l2.assertEqual("[3 2 1]", "e1");
		l1.assertConsistent("e2");
		l1.clear(); l1.enq(3); l1.enq(2); l1.enq(1); l1.assertEqual(l2, "e3");
		l1.assertEqual("[c b a]", "e4");

		Scanner in = new Scanner("[b c d e]");
		l1.read(in); l1.assertEqual("[b c d e]", "f1");
		l1.expand(15); l1.assertEqual(l1.n(), 15, "f2");
		l1.deleteNext(2); l1.assertEqual("[b d e]", "f3");
		l1.deleteNext(0); l1.assertEqual("[d e]", "f4");
		l1.deleteNext(4); l1.assertEqual("[d]", "f5");
		in = new Scanner("[ b  g   27 ]");
		l1.read(in); l1.assertEqual("[2 7 27]", l1.n(), 27, "f6");
		l1.deleteNext(2); l1.assertEqual("[2 27]", "f7");
		l1.reset(10); l1.assertEqual("[]", "f8");
		
		return true;
	}
	
	/**
	 *  Unit test for List_d data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	
		// add more systematic tests for each individual method
	}
}
