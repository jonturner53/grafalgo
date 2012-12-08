/** @file SaBstSet.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "SaBstSet.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee

/** Constructor for SaBstSet class.
 *  @param N is the number of nodes in the constructed object
 */
SaBstSet::SaBstSet(int N) : SortedSets(N) { }

/** Destructor for SaBstSet class. */
SaBstSet::~SaBstSet() { }

/** Splay a search tree.
 *  @param x is an item in a set (equivalently, node in a search tree);
 *  the operation restructures the tree, moving x to the root
 *  @return the canonical element of the set following the restructuring
 */
item SaBstSet::splay(item x) {
	while (p(x) != 0) splaystep(x);
	return x;
}

/** Perform a single splay step.
 *  @param x is a node in a search tree
 */
void SaBstSet::splaystep(item x) {
	item y = p(x);
	if (y == 0) return;
	item z = p(y);
	if (z != 0) {
	        if (x == left(left(z)) || x == right(right(z)))
			rotate(y);
		else // x is "inner grandchild"
			rotate(x);
	}
	rotate(x);
}

/** Get the canonical element of the set containing an item.
 *  @param i is an item in some set
 *  @return the caonical element of the set containing i; note that
 *  the operation restructures the tree possibly changing the canonical
 *  element
 */
sset SaBstSet::find(item i) { return splay(i); }

/** Get the item with a specified key value.
 *  @param k is a key value
 *  @param s is a reference to the canonical element of some set;
 *  if the operation changes the canonical element, then s will change
 *  @return the item in the tree with the specified key, or 0 if
 *  no item has that key
 */
item SaBstSet::access(keytyp k, sset& s) {
	assert (0 <= s && s <= n);
	item x = s;
	while (true) {
		     if (k < kee(x) && left(x) != 0) x = left(x);
		else if (k > kee(x) && right(x) != 0) x = right(x);
		else break;
	}
	splay(x); s = x;
	return key(x) == k ? x : 0;
}

/** Insert item into a set.
 *  @param i is a singleton item
 *  @param s is the canonical element of the set that i is to be inserted into;
 *  if the operation changes the canonical element, s is changed
 *  @return true on success, false on failure
 */
bool SaBstSet::insert(item i, sset& s) {
	if (s == 0) { s = i; return true; }
	item x = s;
        while (1) {
                     if (kee(i) < kee(x) &&  left(x) != 0) x = left(x);
                else if (kee(i) > kee(x) && right(x) != 0) x = right(x);
                else break;
        }
             if (kee(i) < kee(x))  left(x) = i;
        else if (kee(i) > kee(x)) right(x) = i;
        else { splay(x); return false; }
        p(i) = x;
	splay(i); s = i;
	return true;
}

/** Remove an item from a set.
 *  @param i is an item in some set
 *  @param s is the set containing i
 *  @return the canonical element of the set that results from removing i
 *  from s
 */
void SaBstSet::remove(item i, sset& s) {
	assert(1 <= i && i <= n && 1 <= s && s <= n);
        item j;
        if (left(i) != 0 && right(i) != 0) {
                for (j = left(i); right(j) != 0; j = right(j)) {}
                swap(i,j);
        }
        // now, i has at most one child
        j = (left(i) != 0 ? left(i) : right(i));
        // j is now the index of the only child that could be non-null
        if (j != 0) p(j) = p(i);
        if (p(i) != 0) {
                     if (i ==  left(p(i)))  left(p(i)) = j;
                else if (i == right(p(i))) right(p(i)) = j;
		s = splay(p(i));
        } else s = j;
        p(i) = left(i) = right(i) = 0;
        return;

}

/** Divide a set at an item
 *  @param i is an item in some set
 *  @param s is the canonical element of the set containing i
 *  @return the pair of sets [s1,s2] that results from splitting s into three
 *  parts; s1 (containing ityems with keys smaller than that of i), i itself,
 *  and s2 (contining items with keys larger than that of i)
 */
setPair SaBstSet::split(item i, sset s) {
	assert(1 <= i && i <= n && 1 <= s && s <= n);
	setPair pair;
	splay(i);
	pair.s1 = left(i); pair.s2 = right(i);
	left(i) = right(i) = p(i) = 0;
	p(pair.s1) = p(pair.s2) = 0;
	return pair;
}
