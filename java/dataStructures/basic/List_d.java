/** \file List_d.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.basic;

import java.util.Arrays;
import java.util.Scanner;
import java.util.ArrayList;

/** Data structure representing a doubly-linked list of integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each index may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. This class extends List and adds support for
 *  reverse traversal and general delete operation.
 */
final public class List_d extends List {
	private int[] Prev;	// Prev[i] is previous index in list

	/** Constructor for List_d object
	 *  @param n is the range of the list
	 *  @param nMax is the max range to allocate space for
	 */
	public List_d(int n, int nMax) { super(n); init(nMax); }
	public List_d(int n) { super(n); init(n()); }
	public List_d() { super(); init(n()); }

	/** Allocate space for and initialize List_d object.
	 *  More precisely, the parts that are not initialize in parent class.
	 *  @param nMax is the max range
	 */
	protected void init(int nMax) {
		assert(n() <= nMax);
		Prev = new int[nMax+1]; Arrays.fill(Prev, 0, n()+1, -1);
	}
	
	/** Allocate space for List_d and initialize it.  */
	public void reset(int n, int nMax) {
		super.reset(n, nMax);
		Prev = new int[nMax+1];
		Arrays.fill(Prev, -1); Prev[0] = 0;
	}
	
	/** Expand the space available for this List_d.
	 *  Rebuilds old value in new space.
	 *  @param n is the index range of the expanded object
	 *  @param nMax is the size of the expanded object.
	 */
	public void expand(int n) {
		if (n <= n()) return;
		if (n+1 > Next.length) {
			List_d nu;
			nu = new List_d(n(), Math.max(n, (int) (1.25 * Next.length)));
			nu.assign(this);
			Next = nu.Next; nu.Next = null;
			Prev = nu.Prev; nu.Prev = null;
		}
		Arrays.fill(Prev, n()+1, n+1, -1);
		super.expand(n);
	}
	
	/** Assignment operator.
	 *  @param l is another list to be copied to this.
	 *  @return true if the two lists are equal
	 */
	public void assign(List_d l) {
		super.assign(l);
		int last_i = 0;
		for (int i = first(); i != 0; i = next(i)) {
			Prev[i] = last_i; last_i = i;
		} 
	}
	public void xfer(List_d l) {
		super.xfer(l); Prev = l.Prev; l.Prev = null;
	}
	
	/** Return the predecessor of an item in the list.
	 *  @param i is item whose predecessor is to be returned
	 *  @return the item that precedes i or 0, if none
	 */
	public int prev(int i) {
		assert(member(i)); return Prev[i];
	}
	
	/** Get an item based on its position in the list.
	 *  @param i is position of item to be returned; negative values
	 *  are interpreted relative to the end of the list.
	 *  @return the item at the specfied position
	 */
	public int at(int i) {
		assert((valid(i) || valid(-1)) && i != 0);
		if (i > 0) return super.at(i);
		int j;
		for (j = last(); j != 0 && i != -1; j = prev(j)) { i++; }
		return j;
	}
	
	/** Insert an item into the list, relative to another.
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  if j == 0, i is inserted at the front of the list
	 */
	public void insert(int i, int j) {
		assert(valid(i) && !member(i) && (j == 0 || member(j)));
		super.insert(i, j);
		// now update Prev
		Prev[i] = j;
		if (i != last()) Prev[next(i)] = i;
	}
	
	/** Remove a specified item.
	 *  @param i is an item to be removed
	 */
	public void delete(int i) {
		assert(valid(i));
		if (!member(i)) return;
		if (i == first()) {
			Prev[next(i)] = 0; super.deleteNext(0);
		} else {
			if (i != last()) Prev[next(i)] = Prev[i];
			super.deleteNext(Prev[i]);
		}
		Prev[i] = -1;
	}

	/** Remove item following a specified item.
	 *  @param i is a list item; the next list item is removed; if i==0 the
	 *  first item is removed
	 */
	public void deleteNext(int i) {
		assert(i == 0 || member(i));
		if (i == last()) return;
		super.deleteNext(i);
		if (Next[i] != 0) Prev[Next[i]] = i;
	}
	
	public int pop() {
		assert(!empty());
		int f = first(); delete(f); return f;
	}

	/** Remove the last item on the list.
	 *  @return true if the list was modified, else false
	 */
	public void popLast() { delete(last()); }

	public boolean consistent() {
		if (!super.consistent()) return false;
		if (Prev[0] != 0) return false;
		for (int i = 1; i <= n(); i++) {
			if ((Next[i] == -1 || Prev[i] == -1) && Next[i] != Prev[i])
				return false;
			if (Next[i] > 0 && Prev[Next[i]] != i) return false;
			if (Prev[i] > 0 && Next[Prev[i]] != i) return false;
		}
		if (Prev[first()] != 0) return false;
		return true;
	}
}
