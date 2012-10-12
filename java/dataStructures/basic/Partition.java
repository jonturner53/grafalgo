/** @file Partition.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;
import algoLib.misc.*;

/** Maintain a partition on positive integers 1..n.
 *  Also known as "disjoint sets" and "union-find".
 */
public class Partition {
	private int n;			///< partition defined over {1,...,n}

	private class Node {
	public int p;			///< parent of node
	public int rank;		///< rank of node
	};
	Node [] node;			///< vector of nodes
	
	/** Constructor for partition.
	 *  @param n defines the set of integers 1..n on which the 
	 *  partition is defined
	 */
	Partition(int n) { this.n = n; node = new Node[n+1]; clear(); }
	
	private int p(int u) { return node[u].p; }
	private int rank(int u) { return node[u].rank; }
	private void setp(int u, int v) { node[u].p = v; }
	private void setrank(int u, int v) { node[u].rank = v; }
	
	/** Inititialize data structure. */
	public void clear() {
		for (int u = 1; u <= n; u++) {
			setp(u,u); setrank(u,0);
		}
		setp(0,0); setrank(0,0);
	}
	
	/** Find and return the canonical element of a set.
	 *  @param x is an int in some set
	 *  @return the canonical element of the set containing x
	 */
	public int find(int x) {
		int root;
		for (root = x; p(root) != root; root = p(root)) { }
		while (x != root) { int px = p(x); setp(x,root); x = px; }
		return root;
	}
	
	/** Combine two sets.
	 *  @param x is the canonical element of some set.
	 *  @param y is the canonical element of another (distinct) set
	 *  @return the canonical element of the set obtained by combining
	 *  the given sets
	 */
	public int link(int x, int y) {
		if (rank(x) > rank(y)) {
			int t = x; x = y; y = t;
		} else if (rank(x) == rank(y)) {
			setrank(y,rank(y)+1);
		}
		setp(x,y);
		return y;
	}
	
	/** Get the canonical element of a set without restructuring the set.
	 *  @param x is an int in some set
	 *  @return the canonical element of the set containing x
	 */
	public int findroot(int x) {
		if (x == p(x)) return(x);
		else return findroot(p(x));
	}
	
	/** Create a string representation of the partition.
	 *  @return the string
	 */
	public String toString() {
		String s = "";
		int [] root = new int[n+1];
		for (int i = 1; i <= n; i++) root[i] = findroot(i);
		int cnt = 0; // count # of elements per line
		for (int i = 1; i <= n; i++) {
			if (i == root[i]) { // i is a root
				int j;
				for (j = 1; root[j] != i; j++) {}
				s += "[" + Util.node2string(j,n);
				if (j == i) s += "*";
				cnt++;
				for (j++; j <= n; j++) {
					if (root[j] == i) {
						s += " " +
						     Util.node2string(j,n);
						if (j == i) s += "*";
						cnt++;
						if (cnt > 25) {
							s += "\n"; cnt = 0;
						}
					}
				}
				s += "] ";
				if (cnt > 15) { s += "\n"; cnt = 0; }
			}
		}
		if (cnt > 0) s += "\n";
		return s;
	}
}
