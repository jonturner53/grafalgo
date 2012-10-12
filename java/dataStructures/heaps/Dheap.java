/** @file Dheap.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.heaps;
import algoLib.misc.*;

/** This class implements a heap data structure.
 *  The heap elements are identified by integers in 1..n where n
 *  is specified when a heap object is constructed.
 */
public class Dheap {
	int 	D;			///< base of heap
	int	N;			///< max number of ints in heap
	int	n;			///< number of ints in heap

	int []	h;			///< {h[1],...,h[n]} is set of items
	int []	pos;			///< pos[i] gives position of i in h
	int []	kee;			///< kee[i] is key of int i

	/** Return parent of a node. */
	private int p(int x) { return (x+(D-2))/D; }

	/** Return leftmost child of a node. */
	private int left(int x) { return D*(x-1)+2; }

	/** Return rightmost child of a node. */
	private int right(int x) { return D*x+1; }
	
	/** Constructor for Dheap class.
	 *  @param N1 is the number of ints in the contructed object
	 *  @param D1 is the degree of the underlying heap-ordered tree
	 */
	public Dheap(int N, int D) {
		this.N = N; this.D = D; n = 0;
		h = new int[N+1]; pos = new int[N+1]; kee = new int[N+1];
		for (int i = 1; i <= N; i++) pos[i] = 0;
		h[0] = pos[0] = 0; kee[0] = 0;
	}

	/** Find an int in the heap with the smallest key.
	 *  @return the number of an int that has the smallest key
	 */
	public int findmin() { return n == 0 ? 0 : h[1]; }
	
	/** Delete a minimum key int from the heap and return it.
	 *  @return an int of minimum key from the heap, after deleting it
	 *  from the heap
	 */
	public int deletemin() {
		if (n == 0) return 0;
		int i = h[1]; remove(h[1]);
		return i;
	}
	
	/** Get the key of int.
	 *  @param i is an int in the heap
	 *  @return the value of i's key
	 */
	public int key(int i) { return kee[i]; }
	
	/** Determine if an item is in the heap.
	 *  @param i is an item number
	 *  @return true if i is in the heap, else false
	 */
	public boolean member(int i) { return pos[i] != 0; }
	
	/** Determine if the heap is empty.
	 *  @return true if heap is empty, else false
	 */
	public boolean empty() { return n == 0; };
	
	/** Add item to the heap.
	 *  @param i is an item that is not in the heap
	 *  @param k is the key value under which i is to be inserted
	 */
	public void insert(int i, int k) {
		assert i > 0 : "Dheap:insert: negative argument";
		kee[i] = k; n++; siftup(i,n);
	}
	
	/** Remove an item from the heap.
	 *  @param i is an item in the heap
	 */
	public void remove(int i) {
if (pos[i] <= 0) {
System.out.println("remove: i=" + i + " pos[i]=" + pos[i]);
for (int j = 1; j <= n; j++) System.out.print(" " + h[j]);
System.out.println("\n");
for (int j = 1; j <= n; j++) System.out.print(" " + pos[h[j]]);
System.out.println("\n");
}
		assert i > 0 : "Dheap:remove: negative argument";
		int j = h[n--];
		if (i != j) {
			if (kee[j] <= kee[i]) siftup(j,pos[i]);
			else siftdown(j,pos[i]);
		}
		pos[i] = 0;
	}
	
	/** Perform siftup operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	public void siftup(int i, int x) {
if (x <= 0) {
System.out.println("siftup: x=" + x);
}
		int px = p(x);
		while (x > 1 && kee[i] < kee[h[px]]) {
			h[x] = h[px]; pos[h[x]] = x;
if (x <= 0) {
System.out.println("siftup a: x=" + x);
}
			x = px; px = p(x);
		}
if (x <= 0) {
System.out.println("siftup b: x=" + x);
}
		h[x] = i; pos[i] = x;
	}
	
	/** Perform siftdown operation to restore heap order.
	 *  This is a private helper function.
	 *  @param i is an item to be positioned in the heap
	 *  @param x is a tentative position for i in the heap
	 */
	public void siftdown(int i, int x) {
if (x <= 0) {
System.out.println("siftdown: x=" + x);
}
		int cx = minchild(x);
		while (cx != 0 && kee[h[cx]] < kee[i]) {
			h[x] = h[cx]; pos[h[x]] = x;
if (x <= 0) {
System.out.println("siftdown a: x=" + x);
}
			x = cx; cx = minchild(x);
		}
if (x <= 0) {
System.out.println("siftup b: x=" + x);
}
		h[x] = i; pos[i] = x;
	}
	
	/** Find the position of the child with the smallest key.
	 *  This is a private helper function, used by siftdown.
	 *  @param x is a position of an item in the heap
	 *  @return the position of the child of the int at x, that has
	 *  the smallest key
	 */
	public int minchild(int x) {
if (x <= 0) {
System.out.println("x=" + x);
}
		int y; int minc = left(x);
if (minc < 0) {
System.out.println("x minc=" + minc);
}
		if (minc > n) return 0;
		for (y = minc + 1; y <= right(x) && y <= n; y++) {
if (y < 0 || h[y] < 0 || minc < 0 || h[minc] < 0) {
System.out.println("y=" + y);
System.out.println(toString());
}
if (y < 0 || h[y] < 0 || minc < 0 || h[minc] < 0)
System.out.println("h[y]=" + h[y]);
if (y < 0 || h[y] < 0 || minc < 0 || h[minc] < 0)
System.out.println("minc=" + minc);
if (y < 0 || h[y] < 0 || minc < 0 || h[minc] < 0)
System.out.println("h[minc]=" + h[minc]);
			if (kee[h[y]] < kee[h[minc]]) minc = y;
		}
		return minc;
	}
	
	/** Change the key of an item in the heap.
	 *  @param i is an item in the heap
	 *  @param k is a new key value for item i
	 */
	public void changekey(int i, int k) {
		int ki = kee[i]; kee[i] = k;
		if (k == ki) return;
		if (k < ki) siftup(i,pos[i]);
		else siftdown(i,pos[i]);
	}
	
	/** Construct a string representation of this object.
	 *  @param s is a string in which the result is returned
	 *  @return a reference to s
	 */
	public String toString() {
		String s = "";
		for (int i = 1; i <= n; i++) {
			s += "(" + Util.node2string(h[i],N);
			s += "," + kee[h[i]] + ") ";
			if ((i%10) == 0) s += "\n";
		}
		if ((n%10) != 0) s += "\n";
		return s;
	}
}
