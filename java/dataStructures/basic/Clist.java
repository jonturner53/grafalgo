/** @file Clist.java 
 *
 * @author Jon Turner
 * @date 2011
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;

public class Clist {
	private int N;			// list defined on ints in {1,...,N}
	private class ListNode {
	int	next;			// index of successor
	int	prev;			// index of predecessor
	};
	ListNode[] node;

	public Clist(int N) {
		this.N = N;
		node = new ListNode[N+1];
		for (int i = 0; i <= N; i++) {
			node[i] = new ListNode();
			node[i].next = node[i].prev = i;
		}
	}
	
	/** Reset the data structure, moving all items into single node lists.
	*/
	public void reset() {
		for (int i = 0; i <= N; i++) {
			node[i].next = node[i].prev = i;
		}
	}

	/** Get the successor of a list int.
	 *  @param i is a list int
	 *  @return the int that follows i in its list
	 */
	public int suc(int i) {
		assert(0 <= i && i <= N); return node[i].next;
	}
	
	/** Get the predecessor of a list int.
	 *  @param i is a list int
	 *  @return the int that precedes i in its list
	 */
	public int pred(int i) {
		assert(0 <= i && i <= N); return node[i].prev;
	}
	
	/** Remove an int from its list.
	 *  This method turns the int into a singleton list.
	 *  @param i is a list int
	 */
	public void remove(int i) {
		assert(0 <= i && i <= N);
		node[node[i].prev].next = node[i].next;
		node[node[i].next].prev = node[i].prev;
		node[i].next = node[i].prev = i;
	}
	
	/** Join two lists together.
	 *  @param i is a list int
	 *  @param j is a list int on some other list
	 *  Note: the method will corrupt the data structure if
	 *  i and j already belong to the same list; it's the caller's
	 *  responsiblity to ensure this doesn't happen
	 */
	public void join(int i, int j) {
		assert(0 <= i && i <= N && 0 <= j && j <= N);
		if (i == 0 || j == 0) return;
		node[node[i].next].prev = node[j].prev;
		node[node[j].prev].next = node[i].next;
		node[i].next = j; node[j].prev = i;
	}
	
	/** Produce a String representation of the object.
	 *  @param s is a String in which the result will be returned
	 *  @return a reference to s
	 */
	public String toString() {
		String s = "";
		int i, j;
		boolean[] mark = new boolean[N+1];
		for (i = 1; i <= N; i++) mark[i] = false;
		for (i = 1; i <= N; i++) {
			if (mark[i]) continue; 
			if (i > 1) s += ", ";
			mark[i] = true;
			s += "(";
			if (N <= 26) s += ((char) ('a'+(i-1)));
			else s += i;
			for (j = node[i].next; j != i; j = node[j].next) {
				mark[j] = true;
				s += " ";
				if (N <= 26) s = s + ((char) ('a'+(j-1)));
				else s += j;
			}
			s += ")";
		}
		return s;
	}
}
