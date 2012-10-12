/** @file IntervalSets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for data structure representing a collection of items
// and which allows whole intervals to be inserted and removed in one step.
// Each set is maintained in sorted order using self-adjusting
// binary search trees.

typedef int set;		// set in collection
typedef int item;		// item in set
typedef int keytyp;
struct Spair { set s1,s2; };	// pair of sets, returned by split
struct Interval { int l,h; };

/** Class that represents a collection of sets of integer intervals.
 */
class IntervalSets {
public: 	IntervalSets(int=100);
		~IntervalSets();
	set	insert(int,int,set);	// insert interval into set
	set	remove(int,int,set);	// remove interval from set
	interval search(int,set);	// return largest interval containing
					//  given integer
	set	join(set,int,int,set);// join two sets at interval
	ispair	split(int,set);	// split set on int and return set pair
	void	print();		// print collection of sets
	void	sprint(set);		// print single set
	void	tprint(set,int);	// print single set as tree

private:
	int	n;			// number of disjoint intervals.
	int	free;			// pointer to first free node
	struct TreeNode {
		set lchild, rchild, parent;
		keytyp loval, hival;
	} *vec;
	item	splay(item);
	void	splaystep(item);
	void	lrotate(item);
	void	rrotate(item);
	set	max(set);		// splay at max interval in set
	set	min(set);		// splay at min interval in set
	set	find(int,set);		// splay at node containing int
	void	recover(set);		// recover the nodes in an set
};
