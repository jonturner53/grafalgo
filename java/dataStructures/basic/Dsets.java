/** @file Dsets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures.basic;

import grafalgo.dataStructures.Adt;
import grafalgo.dataStructures.basic.Dlists;

/** Disjoint sets data structure maintains a collection of disjoint
 *  sets over the integers 1..N for some positive integer N. Allows
 *  one to quickly determine if two values are in the same set and
 *  supports constant-time union of two sets.
 */
final public class Dsets extends Adt {
	private int[] P;		///< P[i] is parent of i
	private int[] Rank;		///< Rank[i] is parent of i
	
	public Dsets(int n, int nMax) { super(n); init(nMax); }
	public Dsets(int n) { super(n); init(n()); }
	public Dsets() { super(); init(n()); }

	public void init(int nMax) {
		assert(n() <= nMax);
		P = new int[nMax+1]; Rank = new int[nMax+1]; clear();
	}
	
	/** Allocate space and initialize Dsets object.
	 *  Any old value is discarded.
	 *  @param n is the defined range
	 *  @param nMax is the maximum number of elements that can be accommodated
	 */
	public void reset(int n, int nMax) {
		assert(0 < n && n <= nMax); setRange(n); init(nMax);
	}
	public void reset(int n) { reset(n, n); }

	/** Expand the space available for this object.
	 *  Rebuilds old value in new space.
	 *  @param n is the size of the resized object.
	 */
	public void expand(int n) {
		if (n <= n()) return;
		if (n+1 > P.length) {
			Dsets nu = new Dsets(n(), Math.max(n, (int) (1.25 * P.length)));
			nu.assign(this); this.xfer(nu);
		}
		clear(n()+1, n+1); setRange(n);
	}
	
	/** Copy another Dsets object to this one.
	 *  @param source is another Dsets object
	 */
	public void assign(Dsets ds) {
		if (ds == this) return;
		if (ds.n()+1 > P.length) reset(ds.n());
		else { setRange(ds.n()); }
		for (int i = 0; i <= n(); i++) {
			P[i] = ds.P[i]; Rank[i] = ds.Rank[i];
		}
	}
	public void xfer(Dsets ds) {
		P = ds.P; Rank = ds.Rank; ds.P = ds.Rank = null;
	}
	
	/** Clear all items in a given range.
	 *  @param lo is the low end of the range of items to be cleared
	 *  @param hi is the high end of the range; all items <hi are cleared
	 */
	public void clear(int lo, int hi) {
		for (int i = lo; i < hi; i++) { P[i] = i; Rank[i] = 0; }
	}
	public void clear() { clear(0, n()+1); }
	public void clear(int u) { P[u] = u; Rank[u] = 0; }

	/** Return parent of a set element in the tree representation of the set.
	 *  @param i index of a set element
	 *  @return the parent of i
	 */
	public int p(int i) { return P[i]; }

	public int rank(int i) { return Rank[i]; }
	
	/** Find and return the canonical element of a set.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	public int find(int i) {
		assert(valid(i));
		int root;
		for (root = i; p(root) != root; root = p(root)) ;
		while (i != root) { int pi = p(i); P[i] = root; i = pi; }
		return p(i);
	}
	
	/** Combine two sets.
	 *  @param i is the canonical element of some set.
	 *  @param j is the canonical element of another (distinct) set
	 *  @return the canonical element of the set obtained by combining
	 *  the given sets
	 */
	public int link(int i, int j) {
		assert(valid(i) && valid(j) && p(i) == i && p(j) == j && i != j);
		if (rank(i) < rank(j)) {
			int t = i; i = j; j = t;
		} else if (rank(i) == rank(j)) {
			Rank[i]++;
		}
		P[j] = i;
		return i;
	}
	
	/** Get the canonical element of a set without restructuring the set.
	 *  @param i is an index in some set
	 *  @return the canonical element of the set containing i
	 */
	public int findroot(int i) {
		assert(valid(i));
		if (i == p(i)) return(i);
		else return findroot(p(i));
	}
	
	/** Create a string representation of the disjoint sets.
	 *  @param s is a reference to a string in which the partition is returned.
	 *  @return a reference to s
	 */
	public String toString() {
		String s = "{";
		int[] size = new int[n()+1];
		int[] root = new int[n()+1];
		for (int i = 1; i <= n(); i++) { root[i] = findroot(i); size[i] = 0; }
		for (int i = 1; i <= n(); i++) size[root[i]]++;
		// for root nodes i, size[i] is number of nodes in tree
		boolean firstSet = true;
		for (int i = 1; i <= n(); i++) {
			if (p(i) == i) { // i is a canonical element
				if (firstSet) firstSet = false;
				else s += " ";
				if (size[i] == 1) {
					s += index2string(i); continue;
				}
				s += "(" + index2string(i);
				for (int j = 1; j <= n(); j++) {
					if (j != i && root[j] == i)
						s += " " + index2string(j);
				}
				s += ")";
			}
		}
		s += "}";
		return s;
	}

	public String toLongString() {
		// for each tree node, identify a firstChild node
		int[] firstChild = new int[n()+1];
		for (int i = 0; i <= n(); i++) firstChild[i] = 0;
		int firstRoot = 0;
		for (int i = 0; i <= n(); i++) {
			if (p(i) == i && firstRoot == 0) firstRoot = i;
			if (p(i) != i && firstChild[p(i)] == 0)
				firstChild[p(i)] = i;
		}
		// create lists of siblings within the trees (treat roots as siblings)
		Dlists sibs = new Dlists(n());
		for (int i = 0; i <= n(); i++) {
			if (p(i) == i && i != firstRoot)
				sibs.join(firstRoot, i);
			if (p(i) != i && i != firstChild[p(i)])
				sibs.join(firstChild[p(i)], i);
		}
		// now, build string with recursive helper
		String s = "{";
		if (firstRoot != 0) {
			for (int r = sibs.first(firstRoot); r != 0; r = sibs.next(r)) {
				if (r != sibs.first(firstRoot)) s += " ";
				s += subtree2string(r, firstChild, sibs);
			}
		}
		s += "}";
		return s;
	}

	public String subtree2string(int u, int[] firstChild, Dlists sibs) {
		String s = index2string(u);
		if (firstChild[u] == 0) return s;
		if (p(u) == u) s += "." + rank(u);
		s += "(";
		for (int c = sibs.first(firstChild[u]); c != 0; c = sibs.next(c)) {
			if (c != firstChild[u]) s += " ";
			s += subtree2string(c, firstChild, sibs);
		}
		s += ")";
		return s;
	}
}
