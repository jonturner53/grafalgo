/** \file TestHeap_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import java.util.Scanner;
import java.util.ArrayList;
import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.heaps.Heap_d;

public final class testHeap_d {
	public static boolean basicTests() {
		int n1 = 10; Heap_d h1 = new Heap_d(n1);

		h1.assertEqual(h1.n(), 10, "a1");
		h1.assertTrue(h1.empty(), "a2");
		for (int i = 1; i <= n1; i++)
			h1.assertTrue(!h1.member(i), "a3 " + i);
	
		h1.insert(3, 5); h1.assertEqual("{c:5}", "b1");
		h1.assertTrue(!h1.empty(),"b2");
		h1.assertTrue(h1.member(3),"b3");
		h1.assertEqual(h1.findmin(), 3, "b4");
		h1.insert(6, 2); h1.insert(8, 1); h1.insert(7, 4);
		h1.assertEqual("{h:1 g:4 f:2 c:5}", "b5");
		h1.assertEqual(h1.deletemin(), 8, "b6");
		h1.assertEqual("{f:2 g:4 c:5}", "b7");
	
		int n2 = 27; Heap_d h2 = new Heap_d(n2);
		h2.insert(7, 4); h2.insert(6, 2); h2.insert(3, 5);
		h2.assertEqual(h1, "e2");
		h2.assertEqual(h2.deletemin(), (int) 6, "e3");
		h2.assertTrue(!(h1.equals(h2)), "e4");
		h1.changekey(3, 1);
		h1.assertEqual("{c:1 g:4 f:2}", "e5");
		
		return true;
	}
	
	/**
	 *  Unit test for Heap_d data structure.
	 */
	public static void main(String[] args) {
		System.out.println("running basic tests");
		if (basicTests()) System.out.println("basic tests passed");
	
		// add more systematic tests for each individual method
	}
}
