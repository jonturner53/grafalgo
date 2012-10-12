/** @file UiList.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;
import algoLib.misc.*;

/** Data structure representing a list of unique integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each integer may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. Less general than generic lists but
 *  faster and more space-efficient.
 */
public class UiList {
	private int nn;		///< list defined on ints in {1,...,nn}
	private int head;	///< first item in list
	private int tail;	///< last item in list
	private int [] nxt;	///< nxt[i] is successor of i in list
	
	public UiList(int nn) {
		this.nn = nn; makeSpace(nn);
	}
	
	/** Create a list from another */
	public void UiList(UiList source) {
		this.nn = source.n(); makeSpace(nn); copyFrom(source);
	}
	
	/** Allocate and initialize space for list.
	 *  @param nu_n is number of items to provide space for
	 */
	protected void makeSpace(int nu_n) {
		nn = nu_n;
		nxt = new int[nn+1];
		for (int i = 1; i <= nn; i++) nxt[i] = -1;
		nxt[0] = 0; head = tail = 0;
	}

	/** Copy into list from original. */
	public void copyFrom(UiList original) {
		if (original == this) return;
		if (original.n() > n()) reSize(original.n());
		for (int i = original.first(); i != 0; i = original.next(i))
			addLast(i);
	}
	
	/** Resize a UiList object.
	 *  The old value is discarded.
	 *  @param nu_n is the size of the resized object.
	 */
	public void reSize(int nu_n) { makeSpace(nu_n); }
	
	/** Remove all elements from list. */
	public void clear() {
		while (head != 0) {
			int i = head; head = nxt[i]; nxt[i] = -1;
		}
		tail = 0;
	}
	
	/** Get the next item in a list.
	 *  @param i is an item on the list
	 *  @return the item that follows i, or 0 if there is no next item
	 */
	public int next(int i) { return nxt[i]; }
	
	/** Get first item on list.
	 *  @return the first item on the list or 0 if the list is empty
	 */
	public int first() { return head; }
	
	/** Get the last item on list.
	 *  @return the last item on the list or 0 if the list is empty
	 */
	public int last() { return tail; }
	
	/** Get the largest value that can be stored in list.
	 *  @return the largest value that can be stored in the list.
	 */
	public int n() { return nn; }
	
	/** Test if a given item is valid for this UiList.
	 *  @param i is an integer
	 *  @return true if i is in range for this UiList.
	 */
	public boolean valid(int i) { return 1 <= i && i <= n(); }
	
	/** Test if list is empty.
	 *  @return true if list is empty, else false.
	 */
	public boolean empty() { return first() == 0; }
	
	/** Test if an item is in the list.
	 *  @param i is an item
	 *  @return true if i is in the list, else false
	 */
	public boolean member(int i) {
		if (!valid(i)) return false;
		return nxt[i] != -1;
	}
	
	/** Add item to the front of the list.
	 *  @param item to be added.
	 *  @return true if the list was modified, else false
	 */
	public boolean addFirst(int i) { return insert(i,0); }
	
	/** Add item to the end of the list.
	 *  @param item to be added.
	 *  @return true if the list was modified, else false
	 */
	public boolean addLast(int i) { return insert(i,last()); }
	
	/** Remove the first item in the list.
	 *  @return true if the list was modified, else false
	 */
	public boolean removeFirst() { return removeNext(0); }
	
	/** Get an item based on its position in the list.
	 *  @param i is position of item to be returned; must be between
	 *  1 and n()
	 *  @return item at position i, or 0 if no such item
	 */
	public int get(int i) {
		if (!valid(i)) return 0;
		if (i == 1) return first();
		int j;
		for (j = first(); j != 0 && (--i != 0); j = nxt[j]) {}
		return j;
	}
	
	/** Insert an item into the list, relative to another.
	 *  @param i is item to insert; if i is 0 or already in
	 *  the list, no change is made
	 *  @param j is item after which i is to be inserted;
	 *  if zero, i is inserted at the front of the list
	 *  @return true if list was modified, else false
	 */
	public boolean insert(int i, int j) {
		if (!((i == 0 || valid(i)) && (j == 0 || valid(j))))
			return false;
		if (i == 0 || member(i)) return false;
		if (j == 0) {
			if (empty()) tail = i;
			nxt[i] = head; head = i;
			return true;
		}
		nxt[i] = nxt[j]; nxt[j] = i;
		if (tail == j) tail = i;
		return true;
	}
	
	/** Remove the item following a specified item.
	 *  @param i is item whose successor is to be removed;
	 *  if zero, the first item is removed
	 *  @return true if the list was modified, else false
	 */
	public boolean removeNext(int i) {
		if (i < 0 || i > n()) return false;
		if (empty() || (i == last()) || (i != 0 && !member(i)))
		    	return false;
		int j;
		if (i == 0) { j = head;   head = nxt[j]; }
		else	    { j = nxt[i]; nxt[i] = nxt[j]; }
		if (tail == j) tail = i;
		nxt[j] = -1;
		return true;
	}
	
	/** Compare two lists for equality.
	 *
	 *  @param other is the list to be compared to this one
	 *  @return true if they are the same list or have the
	 *  same contents (in the same order);
	 *  they need not have the same storage capacity to be equal
	 */
	public boolean equals(UiList other) {
		if (this == other) return true;
		int i = first(); int j = other.first();
		while (i == j) {
			if (i == 0) return true;
			i = next(i); j = other.next(j);
		}
		return false;
	}
	
	/** Check the data structure for consistency.
	 *  @return true if the data structure is consistent, else false
	 */
	public boolean isConsistent() {
		if (head < 0 || head > n()) return false;
		if (tail < 0 || tail > n()) return false;
		if ((head == 0 || tail == 0) && head != tail) return false;
		int cnt = 0;
		for (int i = first(); i != 0; i = next(i)) {
			if (i < 0 || i > n()) return false;
			if (i == tail &&  next(i) != 0) return false;
			if (++cnt > n()) return false;
		}
		for (int i = 1; i <= n(); i++) if (nxt[i] == -1) cnt++;
		if (cnt != n()) return false;
		if (nxt[0] != 0) return false;
		return true;
	}
	
	/** Create a string representation of a given string.
	 *
	 *  @param s is string used to return value
	 */
	public String toString() {
		String s = "[ ";
		for (int i = first(); i != 0; i = next(i)) {
			s += Util.node2string(i,n()) + " ";
		}
		s += "]";
		return s;
	}
}
