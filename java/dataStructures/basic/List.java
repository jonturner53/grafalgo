/** @file List.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.basic;

import java.util.Arrays;
import java.util.Scanner;
import java.util.ArrayList;
import grafalgo.dataStructures.Adt;
import grafalgo.misc.Util;

/** Data structure representing a list of unique integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each integer may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. Less general than generic lists but useful when
 *  underlying index set is shared by multiple data structures.
 */
public class List extends Adt {
	private int First;		///< first item in list
	private int Last;		///< last item in list
	private int Length;		///< number of items in list
	protected int[] Next;	///< Next[i] is successor of i in list
	
	/** Constructor for List object.
	 *  @param n is the range for the list
	 *  @param nMax is the max range to allocate space for
	 */
	public List(int n, int nMax) { super(n); init(nMax); }
	public List(int n) { super(n); init(n()); }
	public List() { super(); init(n()); }
	
	/** Allocate space and initialize List.
	 *  @param nMax is the maximum range to allocate space for
	 */
	protected void init(int nMax) {
		assert (nMax >= n());
		Next = new int[nMax+1]; Arrays.fill(Next, 0, n()+1, -1);
		Next[0] = First = Last = Length = 0;
	}

	/** Reset the range and max range of the list; discard value . O(nMax)
	 *  @param n is the range of the index set
	 *  @param nMax the max range for which space is to be allocated
	 */
	public void reset(int n, int nMax) {
		assert(nMax >= n); setRange(n); init(nMax);
	}
	public void reset(int n) { reset(n, n); }

	public void expand(int n) {
		if (n <= n()) return;
		if (n+1 > Next.length) {
			List nu = new List(n(), Math.max(n, (int) (1.25 * Next.length)));
			nu.assign(this); this.xfer(nu);
		}
		Arrays.fill(Next, n()+1, n+1, -1);
		setRange(n);
	}

	/** Assign new value to list from another. O(size)
	 *  @paran l is a list whose value is to be assigned to this
	 */
	public void assign(List l) {
		if (l == this) return;
		if (l.n()+1 > Next.length) reset(l.n());
		else { clear(); setRange(l.n()); }
		for (int i = l.first(); i != 0; i = l.next(i)) enq(i);
	}

	/** Assign a new value to this, by transferring contents of another list.
	 *  @param l is a list whose contents are to be transferred to this
	 */
	public void xfer(List l) {
		if (l == this) return;
		First = l.First; Last = l.Last; Length = l.Length;
		Next = l.Next; l.Next = null;
	}
	
	/** Remove all elements from list. O(length) */
	public void clear() { while (!empty()) pop(); }
	
	/** Get the next item in a list. O(1)
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	final public int next(int i) { return Next[i]; }
	
	/** Get first item on list. O(1)
	 *  @return the first item on the list or 0 if the list is empty
	 */
	final public int first() { return First; }
	
	/** Get the last item on list. O(1)
	 *  @return the last item on the list or 0 if the list is empty
	 */
	final public int last() { return Last; }

	/** Get an item based on its position in the list.
	 *  @param i is position of index to be returned; must be between
	 *  1 and n()
	 *  @return index at position i, or 0 if no such index
	 */
	public int at(int i) {
	    assert(valid(i) && i != 0);
	    if (i == 1) return first();
		int j;
	    for (j = first(); j != 0 && i != 1; j = next(j)) { i--; }
	    return j;
	}
	
	/** Get the length of the list. O(1)
	 *  @return the number of items in the list.
	 */
	final public int length() { return Length; }
	
	/** Test if list is empty. O(1)
	 *  @return true if list is empty, else false.
	 */
	final public boolean empty() { return length() == 0; }
	
	/** Test if an item is in the list. O(1)
	 *  @param i is an item
	 *  @return true if i is in the list, else false
	 */
	final public boolean member(int i) {
		return valid(i) && (i != 0 && Next[i] != -1);
	}
	
	/** Compare two lists for equality. O(length)
	 *
	 *  @param l is the list to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	public boolean equals(Adt a) {
		if (!(a instanceof List)) return false;
		List l = (List) a;
		if (this == l) return true;
		int i = first(); int j = l.first();
		while (i == j) {
			if (i == 0) return true;
			i = next(i); j = l.next(j);
		}
		return false;
	}
	
	/** Insert an item into the list, relative to another. O(1)
	 *  @param i is item to insert
	 *  @param j is item after which i is to be inserted;
	 *  if zero, i is inserted at the front of the list
	 */
	public void insert(int i, int j) {
		assert(valid(i) && i != 0 && !member(i) && (j == 0 || member(j)));
		if (j == 0) {
			if (empty()) Last = i;
			Next[i] = First; First = i; Length++;
			return;
		}
		Next[i] = Next[j]; Next[j] = i; Length++;
		if (Last == j) Last = i;
		return;
	}
	
	/** Remove the item following a specified item. O(1)
	 *  @param i is item whose successor is to be deleted;
	 *  if zero, the first item is deleted
	 *  @return the deleted item
	 */
	public void deleteNext(int i) {
		assert(i == 0 || member(i));
		if (i == last()) return;
		int j;
		if (i == 0) { j = First;   First = Next[j]; }
		else	    { j = Next[i]; Next[i] = Next[j]; }
		if (Last == j) Last = i;
		Next[j] = -1; Length--;
	}
	
	/** Push item onto front of a list. O(1)
	 *  @param item to be added.
	 */
	final public void push(int i) { insert(i, 0); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	public int pop() { int f = first(); deleteNext(0); return f; }
	
	/** Add item to the end of the list. O(1)
	 *  @param item to be added.
	 *  @return true if the list was modified, else false
	 */
	final public void enq(int i) { insert(i, last()); }
	
	/** Remove the first item in the list. O(1)
	 *  @return the item removed, or 0
	 */
	final public int deq() { return pop(); }
	
	/** Create a string representation of a given string.
	 *
	 *  @param s is string used to return value
	 */
	public String toString() {
		String s = "[";
		for (int i = first(); i != 0; i = next(i)) {
			if (i != first()) s += " ";
			s += index2string(i);
		}
		return s + "]";
	}

	public void write() {
		System.out.println(toString());
	}

	public boolean read(Scanner in) {
		clear();
		ArrayList<Integer> il = readIndexList(in, "\\[", "\\]");
		if (il == null) return false;
		int N = 0;
		for (int i: il) N = Math.max(i, N);
		if (N > n()) expand(N);
		for (int i: il) enq(i);
		return true;
	}

	/** Check data structure for internal consistency.
	 *  @return true if data structure is consistent, else false.
	 */
	public boolean consistent() {
		// check First, Last and Length
		if (!valid(First) || !valid(Last)) return false;
		if ((First == 0 || Last == 0) && (First != Last || Length != 0))
			return false;
		// verify Next array
		if (Next[0] != 0 || Next[Last] != 0) return false;
		int cnt = 0;
		for (int i = 1; i < Next.length; i++) {
			if (valid(Next[i])) {
				if (Next[i] == 0 && i != Last) return false;
				cnt++;
			} else if (Next[i] != -1) {
				return false;
			}
		}
		if (cnt != Length) return false;
		// traverse list and check Last, Length
		for (int i = first(); i != 0; i = next(i)) {
			if (i == last() && cnt != 1) return false;
			if (cnt-- <= 0) return false;
		}
		if (cnt != 0) return false;
		return true;
	}
}
