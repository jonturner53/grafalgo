/** \file List_d.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LIST_D_H
#define LIST_D_H

#include "stdinc.h"
#include "List.h"

namespace grafalgo {

/** Data structure representing a doubly-linked list of indexes.
 *
 *  Used to represent a list of indexes from a defined range 1..n,
 *  where each index may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. This class extends List and adds support for
 *  reverse traversal and general remove operation.
 */
class List_d : public List {
public:		List_d();
		List_d(int);
		List_d(const List_d&);
		List_d(List_d&&);
		~List_d();

	void	init();
	void	resize(int);
	void	expand(int);

	// operators
	List_d&	operator=(const List_d&);
	List_d&	operator=(List_d&&);
	using	List::operator==;

	// index access
	index	get(index) const;
	int	prev(index) const;

	// modifiers
	void    insert(index,index);
        void    remove(index);
	void	removeLast();
	void	clear();

protected:
	// handle dynamic storage
        void    makeSpace();   
	void	freeSpace();
private:
	index	*pred;			// pred[i] is previous index in list
};

/** Return the predecessor of an index in the list.
 *  @param i is index whose predecessor is to be returned
 *  @return the index that precedes i or 0, if none
 */
inline index List_d::prev(index i) const {
        assert(member(i)); return pred[i];
}

/** Remove the last index on the list.
 *  @return true if the list was modified, else false
 */
inline void List_d::removeLast() {
        return remove(last());
}

} // ends namespace

#endif
