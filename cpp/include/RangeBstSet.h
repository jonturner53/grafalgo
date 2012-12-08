/** @file RangeBstSet.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for data structure representing a collection of items
// and which allows whole intervals to be inserted and removed in one step.
// Each bst is maintained in sorted order using self-adjusting
// binary search trees.

typedef int bst;		// set in collection
typedef int keytyp;
struct Spair { set s1,s2; };	// pair of sets, returned by split
struct Interval { int l,h; };

/** Class that represents a collection of sets of integer intervals.
 */
class RangeBstSet {
public: 	RangeBstSet(int=100);
		~RangeBstSet();
	bst	insert(int,int,bst);	// insert interval into bst
	bst	remove(int,int,bst);	// remove interval from bst
	interval search(int,bst);	// return largest interval containing
					//  given integer
	bst	join(bst,int,int,bst);// join two bst at interval
	ispair	split(int,bst);	// split bst on int and return bst pair
	void	print();		// print collection of bsts
	void	sprint(bst);		// print single bst
	void	tprint(bst,int);	// print single bst as tree

private:
	int	n;			// number of disjoint intervals.
	int	free;			// pointer to first free node
	struct TreeNode {
		bst lchild, rchild, parent;
		keytyp loval, hival;
	} *vec;
	item	splay(item);
	void	splaystep(item);
	void	lrotate(item);
	void	rrotate(item);
	bst	max(bst);		// splay at max interval in bst
	bst	min(bst);		// splay at min interval in bst
	bst	find(int,bst);		// splay at node containing int
	void	recover(bst);		// recover the nodes in an bst
};
