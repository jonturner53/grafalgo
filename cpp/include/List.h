/** @file List.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LIST_H
#define LIST_H

#include "Adt.h"
#include "Exceptions.h"

namespace grafalgo {

/** Data structure representing a list of indexes.
 *
 *  An index is a postive integer in 1..n where n is an upper
 *  bound on the size of the list. An index can appear on a list
 *  at most once. Index-based lists are handy in contexts where we
 *  need a common "handle" for a piece of data in several different
 *  data structures. They are also compact, efficient and support
 *  constant-time membership tests (based on the index).
 *
 *  Note: List has several virtual members, insert() and removeNext()
 *  to allow facilitate extension by other classes.
 */
class List : public Adt {
public:		List(int=26);
		~List();

	void	clear();
	void	resize(int);
	void	expand(int);

	void	copyFrom(const List&);

	// methods to access items
	index 	get(position) const;
	index	next(index) const;
	index	first() const;
	index	last() const;
	int	length() const;

	// predicates
	bool	valid(index) const;
	bool	empty() const;
	bool	member(index) const;
	bool	equals(List&) const;
	bool	isConsistent() const;
	
	// modifiers
	virtual bool insert(index,index);
	virtual bool removeNext(index);
	bool	addFirst(index);
	bool	addLast(index);
	bool	removeFirst();

	// input/output
	string&	toString(string&) const;
	friend istream& operator>>(istream&, List&);

protected:
	// managing dynamic storage
        void    makeSpace(int);   
	void	freeSpace();

private:
	int	len;			///< number of elements in list
	index	head;			///< first index in list
	index	tail;			///< last index in list
	index	*nxt;			///< nxt[i] is successor of i in list
};

/** Get the next index in a list.
 *  @param i is an index on the list
 *  @return the index that follows i, or 0 if there is no next index
 */
inline index List::next(index i) const { return nxt[i]; }

/** Get first index on list.
 *  @return the first index on the list or 0 if the list is empty
 */
inline index List::first() const { return head; }

/** Get the last index on list.
 *  @return the last index on the list or 0 if the list is empty
 */
inline index List::last() const { return tail; }

/** Test if a given index is valid for this List.
 *  @param i is an integer
 *  @return true if i is in range for this List.
 */
inline bool List::valid(index i) const { return 1 <= i && i <= n(); }

/** Test if list is empty.
 *  @return true if list is empty, else false.
 */
inline bool List::empty() const { return first() == 0; }

/** Determine the length of the list.
 *  @return the number of items in the list.
 */
inline int List::length() const { return len; }

/** Test if an index is in the list.
 *  @param i is an index
 *  @return true if i is in the list, else false
 */
inline bool List::member(index i) const {
	if (!valid(i)) {
                stringstream ss; ss << "get(" << i << ")";
                string s = ss.str();
                throw IllegalArgumentException(s);
        }
	return nxt[i] != -1;
}

/** Add index to the front of the list.
 *  @param index to be added.
 *  @return true if the list was modified, else false
 */
inline bool List::addFirst(index i) { return insert(i,0); }

/** Add index to the end of the list.
 *  @param index to be added.
 *  @return true if the list was modified, else false
 */
inline bool List::addLast(index i) { return insert(i,last()); }

/** Remove the first index in the list.
 *  @return true if the list was modified, else false
 */
inline bool List::removeFirst() { return removeNext(0); }

} // ending namespace

#endif

