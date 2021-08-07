/** \file ListPair.h
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.basic;

import java.util.Scanner;
import java.util.HashSet;
import java.util.Arrays;
import grafalgo.dataStructures.Adt;

/** Data structure that represents a pair of complementary int lists.
 *  The int values have a limited range 1..n and each int is
 *  always in one of the two lists.  The lists are referred to as
 *  "in" and "out" and can be accessed using the provided methods.
 *  The only way to modify the data structure is to move an item
 *  from one list to the other, using the swap methods.
 *  Initially, all items are in the out list.
 */
public class ListPair extends Adt {
	private int NIn;		///< number of elements in in-list
	private int NOut;		///< number of elements in out-list

	private int FirstIn;	///< first item in the in-list
	private int LastIn;		///< last item in the in-list
	private int FirstOut;	///< first item in the out-list
	private int LastOut;	///< last item in the out-list

	private int[] Next;		///< Next[i] defines next item after i
							///< In items use positive Next values
							///< Out items use negative Next values
	private int[] Prev;		///< Prev[i] defines item preceding i
							///< In items use positive Prev values
							///< Out items use negative Prev values
	
	/** Constructor for list pair.
	 *  @param n specifies the range of integer values
	 */
	public ListPair(int n, int nMax) { super(n); init(nMax); }
	public ListPair(int n) { super(n); init(n()); }
	public ListPair() { super(); init(n()); }

	/** Allocate space and initialize.
	 *  @param nMax is the maximum range
	 */
	private void init(int nMax) {
		assert(n() <= nMax);
		Next = new int[nMax+1]; Prev = new int[nMax+1];
		FirstIn = LastIn = 0; FirstOut = 1; LastOut = n();
		for (int i = 0; i <= n(); i++) {
			Next[i] = -(i+1); Prev[i] = -(i-1);
		}
		Next[n()] = Prev[1] = 0; Next[0] = Prev[0] = 0;
		NIn = 0; NOut = n();
	}
	
	/** Reset the list to support a larger range and max range.
	 *  Amount of space allocated is determined by value of n().
	 */
	public void reset(int n, int nMax) {
		assert(n <= nMax); setRange(n); init(nMax);
	}
	public void reset(int n) { reset(n, n); }
	
	/** Expand the space available for this ListPair.
	 *  Rebuilds old value in new space.
	 *  @param n is the range of the expanded object.
	 */
	public void expand(int n) {
		assert(n > 0);
		if (n <= n()) return;
		if (n+1 > Next.length) {
			ListPair nu;
			nu = new ListPair(n(), Math.max(n, (int) (1.25*Next.length)));
			nu.assign(this); this.xfer(nu);
		}
		for (int i = n()+1; i <= n; i++) {
			Next[i] = -(i+1); Prev[i] = -(i-1);
		}
		if (FirstOut == 0) {
			FirstOut = n()+1; Prev[FirstOut] = 0;
		} else {
			Next[LastOut] = -(n()+1); Prev[n()+1] = -LastOut;
		}
		LastOut = n; Next[LastOut] = 0; NOut = n - NIn;
		setRange(n);
	}
	
	/** Assign one ListPair to another by copying its contents.
	 *  @param l is the ListPair whose contents is to be copied.
	 */
	public void assign(ListPair l) {
		if (l == this) return;
		if (l.n()+1 > Next.length) reset(l.n());
		else { clear(); setRange(l.n()); }
		for (int i = l.firstIn(); i != 0; i = l.nextIn(i)) {
			if (isOut(i)) swap(i);
		}
		for (int i = l.firstOut(); i != 0; i = l.nextOut(i)) {
			swap(i); swap(i); // to match order in l
		}
	}

	/** Assign one ListPair to another by transferring its contents.
	 *  @param l is the ListPair to assign.
	 */
	public void xfer(ListPair l) {
		if (l == this) return;
		Next = l.Next; Prev = l.Prev; l.Next = l.Prev = null;
		FirstIn = l.FirstIn; LastIn = l.LastIn;
		FirstOut = l.FirstOut; LastOut = l.LastOut;
		NIn = l.NIn; NOut = l.NOut;
	}
	
	/** Determine if an item belongs to the "in-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "in-list", else false.
	 */
	public boolean isIn(int i) {
		assert(valid(i)); return Next[i] > 0 || i == LastIn;
	}
	
	/** Determine if an int belongs to the "out-list".
	 *  @param i is a valid list item
	 *  @param return true if i is a member of the "out-list", else false.
	 */
	public boolean isOut(int i) {
		assert(valid(i)); return Next[i] < 0 || i == LastOut;
	}
	
	/** Get the number of elements in the "in-list".  */
	public int nIn() { return NIn; }
	
	/** Get the number of elements in the "in-list".  */
	public int nOut() { return NOut; }
	
	/** Get the first item in the in-list.
	 *  @return the first value on the in-list or 0 if the list is empty.
	 */
	public int firstIn() { return FirstIn; }
	
	/** Get the first item in the out-list.
	 *  @return the first value on the out-list or 0 if the list is empty.
	 */
	public int firstOut() { return FirstOut; }
	
	/** Get the last item in the in-list.
	 *  @return the last value on the in-list or 0 if the list is empty.
	 */
	public int lastIn() { return LastIn; }
	
	/** Get the first item in the out-list.
	 *  @return the last value on the out-list or 0 if the list is empty.
	 */
	public int lastOut() { return LastOut; }
	
	/** Get the next item in the inlist.
	 *  @param i is the "current" value
	 *  @return the next int on the in-list or 0 if no more values
	 */
	public int nextIn(int i) {
		assert(isIn(i)); return Next[i];
	}
	
	/** Get the next value in the outlist.
	 *  @param i is the "current" value
	 *  @return the next value on the out-list or 0 if no more values
	 */
	public int nextOut(int i) {
		assert(isOut(i)); return -Next[i];
	}
	
	/** Get the previous value in the inlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the in-list or 0 if no more values
	 */
	public int prevIn(int i) {
		assert(isIn(i)); return Prev[i];
	}
	
	/** Get the previous value in the outlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the out-list or 0 if no more values
	 */
	public int prevOut(int i) {
		assert(isOut(i)); return -Prev[i];
	}
	
	/** Compare two list pairs for equality.
	 *  @param l is another list pair
	 *  @return true if the in-lists are identical; the out-lists may differ
	 */
	public boolean equals(ListPair l) {
		if (l == this) return true;
		if (firstIn() !=  l.firstIn()) return false;
		for (int i = firstIn(); i != 0; i = nextIn(i))
			if (l.nextIn(i) != nextIn(i)) return false;
		return true;
	}
	
	/** Remove all elements from inSet. */
	public void clear() { while (firstIn() != 0) swap(firstIn()); }
	
	/** Move an item from one list to the other.
	 *  Inserts swapped item at end of the other list
	 *  @param i is the int of item to be swapped
	 */
	public void swap(int i) {
		if (isIn(i)) swap(i, LastOut);
		else swap(i, LastIn);
	}
	
	/** Swap item from one list to the other.
	 *  @param i is a list item
	 *  @param j is a list item in the "other" list; i is inserted
	 *  into the other list, following item j, or at the start if j=0.
	 */
	public void swap(int i, int j) {
		assert(valid(i) && i != 0 && valid(j));
		assert((isIn(i)  && (j == 0 || isOut(j))) ||
			   (isOut(i) && (j == 0 || isIn(j))));
		if (isIn(i)) {
			// first remove i from in-list
			if (i == LastIn) LastIn = Prev[i];
			else Prev[Next[i]] = Prev[i];
			if (i == FirstIn) FirstIn = Next[i];
			else Next[Prev[i]] = Next[i];
	
			// now add i to out-list
			if (NOut == 0) {
				Next[i] = Prev[i] = 0; FirstOut = LastOut = i;
			} else if (j == 0) {
				Next[i] = -FirstOut; Prev[i] = 0;
				Prev[FirstOut] = -i; FirstOut = i;
			} else if (j == LastOut) {
				Next[j] = -i; Prev[i] = -j; Next[i] = 0; LastOut = i;
			} else {
				Next[i] = Next[j]; Prev[i] = -j; 
				Prev[-Next[j]] = -i; Next[j] = -i;
			}
			NIn--; NOut++;
		} else {
			// first remove i from out-list
			if (i == LastOut) LastOut = -Prev[i];
			else Prev[-Next[i]] = Prev[i];
			if (i == FirstOut) FirstOut = -Next[i];
			else Next[-Prev[i]] = Next[i];
	
			// now add i to in-list
			if (NIn == 0) {
				Next[i] = Prev[i] = 0; FirstIn = LastIn = i;
			} else if (j == 0) {
				Next[i] = FirstIn; Prev[i] = 0;
				Prev[FirstIn] = i; FirstIn = i;
			} else if (j == LastIn) {
				Next[j] = i; Prev[i] = j; Next[i] = 0; LastIn = i;
			} else {
				Next[i] = Next[j]; Prev[i] = j; 
				Prev[Next[j]] = i; Next[j] = i;
			}
			NIn++; NOut--;
		}
		return;
	}
	
	/** Create a string representation of a given string.
	 *  @return the string
	 */
	public String toString() {
		String s = "[";
		for (int i = firstIn(); i != 0; i = nextIn(i)) {
			s += index2string(i);
			if (i != lastIn()) s += " ";
		}
		s += " : ";
		for (int i = firstOut(); i != 0; i = nextOut(i)) {
			s += index2string(i);
			if (i != lastOut()) s += " ";
		}
		s += "]";
		return s;
	}

	public boolean read(Scanner in) {
		clear();
		in.skip("\\s*");
		if (in.findWithinHorizon("\\G\\[", 1) == null) return false;
		for (int i = readIndex(in); i > 0; i = readIndex(in)) {
			if (i > n()) expand(i);
			if (isIn(i)) { clear(); return false; }
			swap(i);
		}
		in.skip("\\s*");
		if (in.findWithinHorizon("\\G:", 1) == null) {
			clear(); return false;
		}
		// for out-list, need to ensure all values present in input string,
		// with no repeats; also we must re-order out-list to match input
		HashSet<Integer> outSet = new HashSet<Integer>();
		for (int i = readIndex(in); i > 0; i = readIndex(in)) {
			if (i > n()) expand(i);
			if (isIn(i) || outSet.contains(i)) { clear(); return false; }
			outSet.add(i);
			swap(i); swap(i); // double swap moves i to end of out-list
		}
		if (outSet.size() != nOut()) { clear(); return false; }
		in.skip("\\s*");
		if (in.findWithinHorizon("\\G\\]", 1) == null) {
			clear(); return false;
		}
		return true;
	}
	
	} // ends namespace
