/** @file Partition.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Partition.h"

#define p(x) node[x].p
#define rank(x) node[x].rank

/** Initialize partition so that every element is in separate set.
 *  @param N defines the set of integers 1..N on which the partition is defined
 */
Partition::Partition(int N, int noOpt1) : n(N), noOpt(noOpt1) {
	node = new pnode[n+1];
	clear();
}

/** Destructor for Partition. */
Partition::~Partition() { delete [] node; }

/** Inititialize data structure. */
void Partition::clear() {
	for (item i = 1; i <= n; i++) { p(i) = i; rank(i) = 0; }
	nfind = 0; p(0) = 0; rank(0) = 0;
}

/** Find and return the canonical element of a set.
 *  @param x is an item in some set
 *  @return the canonical element of the set containing x
 */
item Partition::find(item x) {
	assert(1 <= x && x <= n);
	int root;
	for (root = x; p(root) != root; root = p(root)) { nfind++; }
	if (noOpt == 1 || noOpt == 3) return root;
	while (x != root) { int px = p(x); p(x) = root; x = px; }
	return p(x);
}

/** Combine two sets.
 *  @param x is the canonical element of some set.
 *  @param y is the canonical element of another (distinct) set
 *  @return the canonical element of the set obtained by combining
 *  the given sets
 */
item Partition::link(item x, item y) {
	assert(1 <= x && x <= n && 1 <= y && y <= n && x != y);
	if (noOpt == 2 || noOpt == 3) return p(x) = y;
	if (rank(x) > rank(y)) {
		item t = x; x = y; y = t;
	} else if (rank(x) == rank(y))
		rank(y)++;
	return p(x) = y;
}

/** Get the canonical element of a set without restructuring the set.
 *  @param x is an item in some set
 *  @return the canonical element of the set containing x
 */
int Partition::findroot(int x) const {
	if (x == p(x)) return(x);
	else return findroot(p(x));
}

/** Create a string representation of the partition.
 *  @param s is a reference to a string in which the partition is returned.
 *  @return a reference to s
 */
string& Partition::toString(string& s) const {
	stringstream ss;
	int *root = new int[n+1];
	for (int i = 1; i <= n; i++) root[i] = findroot(i);
	int cnt = 0; // count # of elements per line
	for (int i = 1; i <= n; i++) {
		if (i == root[i]) { // i is a root
			int j;
			for (j = 1; root[j] != i; j++) {}
			string s1;
			ss << "[" + Util::node2string(j,n,s1);
			if (j == i) ss << "*";
			cnt++;
			for (j++; j <= n; j++) {
				if (root[j] == i) {
					ss << " " + Util::node2string(j,n,s1);
					if (j == i) ss << "*";
					cnt++;
					if (cnt > 25) { ss << "\n"; cnt = 0; }
				}
			}
			ss << "] ";
			if (cnt > 15) { ss << "\n"; cnt = 0; }
		}
	}
	if (cnt > 0) ss << "\n";
	delete [] root;
	s = ss.str();
	return s;
}
