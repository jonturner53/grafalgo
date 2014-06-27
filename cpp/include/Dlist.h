/** \file Dlist.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DLIST_H
#define DLIST_H

#include "stdinc.h"
#include "List.h"

namespace grafalgo {

/** Data structure representing a list of indexes.
 *
 *  Used to represent a list of indexes from a defined range 1..n,
 *  where each index may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. This class extends List and adds support for
 *  reverse traversal and general remove operation.
 */
class Dlist : public List {
public:		Dlist(int=26);
		Dlist(const Dlist&);
		Dlist(Dlist&&);
		~Dlist();

	void	resize(int);
	void	expand(int);

	// operators
	Dlist&	operator=(const Dlist&);
	Dlist&	operator=(Dlist&&);
	using	List::operator==;

	// index access
	index	get(index) const;
	int	prev(index) const;

	// modifiers
	bool    insert(index,index);
	bool	addFirst(index);
	bool	addLast(index);
        bool    remove(index);
	bool	removeLast();
	using	List::clear;

protected:
	// handle dynamic storage
        void    makeSpace();   
	void	freeSpace();
private:
	index	*prv;			// prv[i] is previous index in list
};

/** Return the predecessor of an index in the list.
 *  @param i is index whose predecessor is to be returned
 *  @return the index that precedes i or 0, if none
 */
inline index Dlist::prev(index i) const {
        assert(valid(i) && member(i)); return prv[i];
}

/** Add index to the front of the list.
 *  @param index to be added.
 *  @return true if the list was modified, else false
 */
inline bool Dlist::addFirst(index i) { return insert(i,0); }

/** Add index to the end of the list.
 *  @param index to be added.
 *  @return true if the list was modified, else false
 */
inline bool Dlist::addLast(index i) { return insert(i,last()); }

/** Remove the last index on the list.
 *  @return true if the list was modified, else false
 */
inline bool Dlist::removeLast() {
        return remove(last());
}

} // ends namespace

#endif
