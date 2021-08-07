/** @file Heap_d.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.heaps;

import java.util.Arrays;
import grafalgo.dataStructures.Adt;

/** This class implements a heap data structure.
 *  The heap elements are identified by indexes in 1..n where n
 *  is specified when a heap object is constructed.
 */
public class Heap_d extends Adt {
	private int d;			///< base of heap
	private int	m;			///< # of items in the heap set

	private int[] hs;		///< {hs[1],...,hs[m]} is heap set
	private int[] pos;		///< pos[i] gives position of i in h
	private int[] Key;		///< Key[i] is key of int i

	/** Constructor for Heap_d object.
	 *  @param n is index range for object
	 *  @param nMax is maximum index range
	 *  @parm d is the base of the heap
	 */
	public Heap_d(int n, int d) { super(n); init(n, d); }
	public Heap_d(int n) { super(n); init(n(), 2); }
	public Heap_d() { super(); init(n(), 2); }
	
	/** Allocate space and initialize Heap_d object.
	 *  @param nMax is the maximum range
	 *  @param d is the base of the heap.
	 */
	public void init(int nMax, int d) {
		hs = new int[nMax+1]; pos = new int[nMax+1]; Key = new int[nMax+1];
		for (int i = 1; i <= n(); i++) pos[i] = 0;
		hs[0] = pos[0] = m = 0; this.d = d;
	}

	/** Reset the heap discarding old value.
	 *  @param n is the new range of the index set
	 *  @param nMax the new max range.
	 *  Wparam d is the new base of the heap.
	 */
	public void reset(int n, int nMax, int d) {
		assert(nMax >= n); setRange(n); init(nMax, d);
	}
	public void reset(int n) { reset(n, n, 2); }
	
	/** Assign a new value by copying from another heap.
	 *  @param h is another heap
	 */
	public void assign(Heap_d h) {
		if (h == this) return;
		if (h.n() > n()) { reset(h.n()); }
		else { clear(); setRange(h.n()); }

		d = h.d; m = h.m;
		for (int p = 1; p <= h.m; p--) {
			int x = h.hs[p];
			hs[p] = x; pos[x] = p; Key[x] = h.Key[x];
		}
	}

	/** Assign a new value by transferring from another heap.
	 *  @param h is another heap
	 */
	public void xfer(Heap_d h) {
		if (h == this) return;
		d = h.d; m = h.m;
		hs = h.hs; pos = h.pos; Key = h.Key;
		h.hs = h.pos = h.Key = null;
	}
	
	/** Expand the space available for this Heap_d.
	 *  Rebuilds old value in new space.
	 *  @param size is the size of the resized object.
	 */

	public void expand(int n) {
		if (n <= n()) return;
		if (n+1 > hs.length) {
			Heap_d nu;
			nu = new Heap_d(n(), Math.max(n, (int) (1.25 * hs.length)));
			nu.assign(this); this.xfer(nu);
		}
		Arrays.fill(pos, n()+1, n+1, 0);
		setRange(n);
	}

	/** Remove all elements from heap. */
	public void clear() {
		for (int x = 1; x <= m; x++) pos[hs[x]] = 0;
		m = 0;
	}

	/** Return parent of a node. */
	private int p(int x) { return (x+(d-2))/d; }

	/** Return leftmost child of a node. */
	private int left(int x) { return d*(x-1)+2; }

	/** Return rightmost child of a node. */
	private int right(int x) { return d*x+1; }
	
	/** Find an int in the heap with the smallest key.
	 *  @return the number of an int that has the smallest key
	 */
	public int findmin() { return empty() ? 0 : hs[1]; }
	
	/** Delete a minimum key int from the heap and return it.
	 *  @return an int of minimum key from the heap, after deleting it
	 *  from the heap
	 */
	public int deletemin() {
		if (empty()) return 0;
		int i = hs[1]; delete(hs[1]);
		return i;
	}
	
	/** Get the key of int.
	 *  @param i is an int in the heap
	 *  @return the value of i's key
	 */
	public int key(int i) { return Key[i]; }
	
	/** Determine if an index is in the heap.
	 *  @param i is an index
	 *  @return true if i is in the heap, else false
	 */
	public boolean member(int i) { return pos[i] != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	public boolean empty() { return m == 0; };
	
	/** Add index to the heap.
	 *  @param i is an index that is not in the heap
	 *  @param k is the key value under which i is to be inserted
	 */
	public void insert(int i, int k) {
		assert i > 0;
		if (i > hs.length) expand(i);
		Key[i] = k; m++; siftup(i, m);
	}
	
	/** Remove an index from the heap.
	 *  @param i is an index in the heap
	 */
	public void delete(int i) {
		assert i > 0;
		int j = hs[m--];
		if (i != j) {
			if (Key[j] <= Key[i]) siftup(j, pos[i]);
			else siftdown(j,pos[i]);
		}
		pos[i] = 0;
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an index to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	private void siftup(int i, int x) {
		int px = p(x);
		while (x > 1 && Key[i] < Key[hs[px]]) {
			hs[x] = hs[px]; pos[hs[x]] = x;
			x = px; px = p(x);
		}
		hs[x] = i; pos[i] = x;
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an index to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	private void siftdown(int i, int x) {
		int cx = minchild(x);
		while (cx != 0 && Key[hs[cx]] < Key[i]) {
			hs[x] = hs[cx]; pos[hs[x]] = x;
			x = cx; cx = minchild(x);
		}
		hs[x] = i; pos[i] = x;
	}
	
	/** Find the position of the child with the smallest key.
	 *  This is a private helper function, used by siftdown.
	 *  @param x is a position of an index in the heap
	 *  @return the position of the child of the int at x, that has
	 *  the smallest key
	 */
	private int minchild(int x) {
		int y; int minc = left(x);
		if (minc > m) return 0;
		for (y = minc + 1; y <= right(x) && y <= m; y++) {
			if (Key[hs[y]] < Key[hs[minc]]) minc = y;
		}
		return minc;
	}
	
	/** Change the key of an index in the heap.
	 *  @param i is an index in the heap
	 *  @param k is a new key value for index i
	 */
	public void changekey(int i, int k) {
		int ki = Key[i]; Key[i] = k;
		if (k == ki) return;
		if (k < ki) siftup(i,pos[i]);
		else siftdown(i,pos[i]);
	}

	/** Determine if two heaps are equal.
	 *  @param h is a heap to be compared to this
	 *  @return true if both heap sets contain the same items with the
	 *  the same keys; otherwise, return false
	 */
	@Override
	public boolean equals(Adt a) {
		if (!(a instanceof Heap_d)) return false;
		Heap_d h = (Heap_d) a;
		if (m != h.m) return false;
		for (int i = 1; i <= m; i++) {
			int x = hs[i];
			if (!h.member(x) || key(x) != h.key(x)) return false;
			int y = h.hs[i];
			if (!member(y) || key(y) != h.key(y)) return false;
		}
		return true;
	}
	
	/** Construct a string representation of this object.
	 *  @param s is a string in which the result is returned
	 *  @return the string
	 */
	@Override
	public String toString() {
		String s = "";
		for (int i = 1; i <= m; i++) {
			if (i > 1) s += " ";
			s += index2string(hs[i]) + ":" + Key[hs[i]];
		}
		return "{" + s + "}";
	}
}
