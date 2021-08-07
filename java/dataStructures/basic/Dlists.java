/** @file Dlists.java 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.basic;

import java.util.Scanner;
import java.util.ArrayList;
import grafalgo.dataStructures.Adt;

/** The Dlists class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n.
 */
final public class Dlists extends Adt {
	private int[] Next;
	private int[] Prev;

	public Dlists(int n, int nMax) { super(n); init(nMax); }
	public Dlists(int n) { super(n); init(n()); }
	public Dlists() { super(); init(n()); }

	public void init(int nMax) {
		assert(n() <= nMax);
		Next = new int[nMax+1]; Prev = new int[nMax+1];
		// initialize to singleton lists
		for (int i = 0; i <= n(); i++) { Next[i] = 0; Prev[i] = i; }
	}

	public void reset(int n, int nMax) {
		assert(n <= nMax);
		setRange(n); init(nMax);
	}
	public void reset(int n) { reset(n, n); }

	public void expand(int n) {
		if (n <= n()) return;
		if (n+1 > Next.length) {
			Dlists nu;
			nu = new Dlists(n(), Math.max(n, (int) 1.25 * Next.length));
			nu.assign(this); this.xfer(nu);
		}
		// make singletons from items in expanded range`
		for (int i = n()+1; i <= n; i++) { Next[i] = 0; Prev[i] = i; }
		setRange(n);
	}

	public void assign(Dlists dl) {
		if (dl == this) return;
		if (dl.n()+1 > Next.length) reset(dl.n());
		else { clear(); setRange(dl.n()); }
		for (int i = 0; i <= n(); i++) {
			Next[i] = dl.Next[i]; Prev[i] = dl.Prev[i];
		}
	}
	public void xfer(Dlists dl) {
		if (dl == this) return;
		Next = dl.Next; Prev = dl.Prev; dl.Next = dl.Prev = null;
	}
	
	/** Clear the data structure, moving all items into single node lists.
	*/
	public void clear() {
		for (int i = 0; i <= n(); i++) { Next[i] = 0; Prev[i] = i; }
	}

	/** Get the first item in a list.
	 *  @param l is the id of a list.
	 *  @return the index of the first item in the list
	 */
	public int first(int l) {
		assert(valid(l)); return l;
	}

	private boolean isFirst(int i) {
		return Next[Prev[i]] == 0;
	}
	
	/** Get the last item in a list.
	 *  @param l is the id of list.
	 *  @return the last item in the list
	 */
	public int last(int l) {
		assert(valid(l) && isFirst(l)); return Prev[l];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @return the item that follows i in its list
	 */
	public int next(int i) {
		assert(valid(i)); return Next[i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @return the int that precedes i in its list
	 */
	public int prev(int i) {
		assert(valid(i)); return (isFirst(i) ? 0 : Prev[i]);
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	public boolean singleton(int i) {
		assert(valid(i)); return Prev[i] == i;
	}
	
	/** Change the id for a given list.
	 *  @param l is an id of some list
	 *  @param j is the index of some item in the list; on return j is the id
	 */
	public void rename(int l, int j) {
		assert(valid(l) && valid(j) && isFirst(l));
		Next[Prev[l]] = l; Next[Prev[j]] = 0;
	}

	/** Find the identifier of a list.
	 *  @param i is an item on some list
	 *  @return the id of the list
	 */
	public int findList(int i) {
		assert(valid(i));
		while (!isFirst(i)) i = Prev[i];
		return i;
	}
	
	/** Remove an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param l is a list id
	 *  @return the id of the modified list, or 0 if l was a singleton
	 */
	public int delete(int i, int l) {
		assert(valid(i) && valid(l) && isFirst(l));
		if (singleton(l)) return 0;
		if (i == l) {
			Prev[Next[l]] = Prev[l];
			l = Next[l]; // l is now the new id
		} else if (i == last(l)) {
			Prev[l] = Prev[i]; Next[Prev[i]] = 0;
		} else {
			Prev[Next[i]] = Prev[i]; Next[Prev[i]] = Next[i];
		}
		Next[i] = 0; Prev[i] = i;
		return l;
	}
	
	/** Join two lists together.
	 *  @param l1 is a list id
	 *  @param l2 is a second list id
	 *  @return the id of the list formed by joining the two lists;
	 *  defined to be l1, for non-zero l1
	 */
	public int join(int l1, int l2) {
		assert(valid(l1) && valid(l2));
		if (l2 == 0 || l1 == l2) return l1;
		if (l1 == 0) return l2;
		assert(isFirst(l1) && isFirst(l2));
		int last2 = last(l2);
		Next[Prev[l1]] = l2;
		Prev[l2] = Prev[l1];
		Prev[l1] = last2;
		return l1;
	}
	
	/** Produce a String representation of the object.
	 *  @return a string such as "[(a c), (d b e), (f), (g)]".
	 */
	public String toString() {
		String s = "[";
		for (int l = 1; l <= n(); l++) {
			if (!isFirst(l)) continue;
			if (s.length() > 1) s += ", ";
			s += "(";
			for (int i = first(l); i != 0; i = next(i)) {
				if (i != first(l)) s += " ";
				s += index2string(i);
			}
			s += ")";
		}
		return s + "]";
	}

	/** Read in a new Dlists value
	 *  @param in is a Scanner object, typically attached to a file or string.
	 *  @return true on success, else false
	 */
	public boolean read(Scanner in) {
		clear();
		in.skip("\\s*");
		if (in.findWithinHorizon("\\G\\[", 1) == null) return false;
		ArrayList<Integer> il = readIndexList(in, "\\(", "\\)");
		while (il != null) {
			int N = 0;
			for (int i: il) N = Math.max(i, N);
			if (N > n()) expand(N);
			int first = il.get(0);
			for (int i: il) if (i != first) join(first, i);
			in.skip("\\s*");
			if (in.findWithinHorizon("\\G,", 1) == null) break;
			il = readIndexList(in, "\\(", "\\)");
		}
		in.skip("\\s*");
		if (in.findWithinHorizon("\\G\\]", 1) == null) {
			clear(); return false;
		}
		return true;
	}
}
