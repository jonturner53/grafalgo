/** @file Ssets_sat.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "Ssets_sat.h"

#define left(x) node[x].left
#define right(x) node[x].right
#define p(x) node[x].p
#define kee(x) node[x].kee

namespace grafalgo {

/** Constructor for Ssets_sat class.
 *  @param n defines the index range for the constructed object.
 */
Ssets_sat::Ssets_sat(int n) : Ssets(n) {}

/** Destructor for Ssets_sat class. */
Ssets_sat::~Ssets_sat() {}

/** Splay a search tree.
 *  @param x is an item in a bst (equivalently, node in a search tree);
 *  the operation restructures the tree, moving x to the root
 *  @return the root of the bst following the restructuring
 */
index Ssets_sat::splay(index x) {
	while (p(x) != 0) splaystep(x);
	return x;
}

/** Perform a single splay step.
 *  @param x is a node in a search tree
 */
void Ssets_sat::splaystep(index x) {
	index y = p(x);
	if (y == 0) return;
	index z = p(y);
	if (z != 0) {
	        if (x == left(left(z)) || x == right(right(z)))
			rotate(y);
		else // x is "inner grandchild"
			rotate(x);
	}
	rotate(x);
}

/** Get the root of the bst containing an item.
 *  @param i is an item in some bst
 *  @return the canonical element of the bst containing i; note that
 *  the operation restructures the tree possibly changing the root
 */
bst Ssets_sat::find(index i) {
	assert(valid(i)); return splay(i);
}

/** Get the root of the bst containing an item.
 *  @param i is an item in some bst
 *  @return the canonical element of the bst containing i; note that
 *  this operation does not restructure the tree
 */
bst Ssets_sat::findroot(index i) {
	assert(valid(i));
	while (p(i) != 0) i = p(i);
	return i;
}

/** Get the item with a specified key value.
 *  @param k is a key value
 *  @param t is a reference to the root of some bst;
 *  if the operation changes the root, then t will change
 *  @return the item in the tree with the specified key, or 0 if
 *  no item has that key
 */
index Ssets_sat::access(keytyp k, bst& t) {
	assert (t == 0 || valid(t));
	index x = t;
	while (true) {
		     if (k < kee(x) && left(x) != 0) x = left(x);
		else if (k > kee(x) && right(x) != 0) x = right(x);
		else break;
	}
	splay(x); t = x;
	return key(x) == k ? x : 0;
}

/** Insert item into a bst.
 *  @param i is a singleton item
 *  @param t is the root of the bst that i is to be inserted into;
 *  if the operation changes the root, t is changed
 *  @return true on success, false on failure
 */
bool Ssets_sat::insert(index i, bst& t) {
	if (t == 0) { t = i; return true; }
	assert(valid(t) && p(t) == 0);
	index x = t;
        while (true) {
                     if (kee(i) < kee(x) &&  left(x) != 0) x = left(x);
                else if (kee(i) > kee(x) && right(x) != 0) x = right(x);
                else break;
        }
             if (kee(i) < kee(x))  left(x) = i;
        else if (kee(i) > kee(x)) right(x) = i;
        else { splay(x); return false; }
        p(i) = x;
	splay(i); t = i;
	return true;
}

/** Remove an item from a bst.
 *  @param i is an item in some bst
 *  @param t is a reference to the root of the bst containing i;
 *  if the operation changes the root of the tree, then the variable
 *  in the calling program is updated to reflect this
 */
void Ssets_sat::remove(index i, bst& t) {
	assert(valid(i) && valid(t) && p(t) == 0);
        index j;
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
		t = splay(p(i));
        } else t = j;
        p(i) = left(i) = right(i) = 0;
        return;
}

/** Divide a bst at an item
 *  @param i is the index of a node in some bst
 *  @param t is the root of the bst containing i
 *  @return the pair of bst [t1,t2] that results from splitting t into three
 *  parts; t1 (containing ityems with keys smaller than that of i), i itself,
 *  and t2 (contining items with keys larger than that of i)
 */
Ssets::BstPair Ssets_sat::split(index i, bst t) {
	assert(valid(i) && valid(t));
	splay(i);
	Ssets::BstPair pair(left(i),right(i));
	left(i) = right(i) = p(i) = 0;
	p(pair.t1) = p(pair.t2) = 0;
	return pair;
}

} // ends namespace
