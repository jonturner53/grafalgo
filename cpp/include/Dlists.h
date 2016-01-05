/** @file Dlists.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DLISTS_H
#define DLISTS_H

#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** This class represents a collection of non-empty lists defined over an
 *  underlying index set. The lists are doubly linked, enabling fast
 *  traversal in either direction, and fast remove operations.
 *  Each list has a distinguished element called its id.
 */
class Dlists : public Adt {
public:		Dlists(int);
		Dlists();
		~Dlists();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Dlists&);

	// list traversal methods
	index	first(index) const;
	index	last(index) const;
	index	findList(index) const;
	index	next(index) const;
	index	prev(index) const;

	bool	singleton(index) const;
	void	rename(index, index);

	// modifiers
	index	join(index,index);
	index	remove(index,index);

	string&	toString(string&) const;
	string	toString() const;

private:
	/** list node structure */
	struct lnode {
	index	succ;		// index of successor - 0 for last item
	index	pred;		// index of predecessor - tail for first item
	} *node;

	void	makeSpace();
	void	freeSpace();
};

/** Get the first item in a list.
 *  @param i is the id of a list.
 *  @return the index of the first item in the list
 */
inline index Dlists::first(index i) const {
	assert(valid(i)); return i;
}

/** Get the last item in a list.
 *  @param i is the id of list.
 *  @return the index of the last item in the list
 */
inline index Dlists::last(index i) const {
	assert(valid(i)); return node[i].pred;
}

/** Get the successor of a list item.
 *  @param i is an index
 *  @return the index that follows i in its list
 */
inline index Dlists::next(index i) const {
	assert(valid(i)); return node[i].succ;
}

/** Get the predecessor of a list item.
 *  @param i is an index
 *  @return the index that precedes i in its list
 */
inline index Dlists::prev(index i) const {
	assert(valid(i));
	return (node[node[i].pred].succ == 0 ? 0 : node[i].pred);
}

/** Determine if an item is in a singleton list.
 *  @param i is the index of an item
 *  @return true if it is the only item in its list, else false
 */
inline bool Dlists::singleton(index i) const {
	assert(valid(i)); return node[i].pred == i;
}

/** Change the id for a given list.
 *  @param i is an id of some list
 *  @param j is the index of some item in the list; on return j is the id
 */
inline void Dlists::rename(index i, index j) {
	assert(valid(i) && valid(j) && node[node[i].pred].succ == 0);
	node[node[i].pred].succ = i; node[node[j].pred].succ = 0;
}

} // ends namespace

#endif
