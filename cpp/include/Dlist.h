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
		~Dlist();

	void	resize(int);
	void	expand(int);

	using   List::copyFrom;

	// index access
	index	get(index) const;
	int	prev(index) const;

	// modifiers
	bool    insert(index,index);
        bool    remove(index);
        bool    removeNext(index);
	bool	removeLast();

protected:
	// handle dynamic storage
        void    makeSpace(int);   
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

/** Remove the index following a specified index.
 *  @param i is index whose successor is to be removed;
 *  if zero, the first index is removed
 *  @return true if the list was modified, else false
 */
inline bool Dlist::removeNext(index i) {
        return remove(i == 0 ? first() : next(i));
}

/** Remove the last index on the list.
 *  @return true if the list was modified, else false
 */
inline bool Dlist::removeLast() {
        return remove(last());
}

} // ends namespace

#endif
