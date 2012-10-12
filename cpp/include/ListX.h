/** @file UiList.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef UILIST_H
#define UILIST_H

#include "stdinc.h"
#include "Exceptions.h"
#include "Util.h"

typedef int item;

/** Data structure representing a list of unique integers.
 *
 *  Used to represent a list of integers from a defined range 1..n,
 *  where each integer may appear on the list at most one time.
 *  Allows fast membership tests in addition to the usual list
 *  operations. Less general than STL list<int>, but significantly
 *  faster and more space-efficient.
 *
 *  Note: UiList has two virtual members, insert() and removeNext()
 *  to allow facilitate extension by other classes.
 */
class UiList {
public:		UiList(int=26);
		UiList(UiList&);
		~UiList();

	virtual void reSize(int);
	virtual void clear();
	UiList&	operator=(const UiList&);

	// item access
	item 	get(int) const;
	item	next(item) const;
	item	first() const;
	item	last() const;
	item	n() const;

	// predicates
	bool	valid(item) const;
	bool	member(item) const;
	bool	empty() const;
	bool	equals(UiList&) const;
	bool	isConsistent() const;

	// modifiers
	virtual bool insert(item,item);
	virtual bool removeNext(item);
	bool	addFirst(item);
	bool	addLast(item);
	bool	removeFirst();

	// input/output
	bool 	fromString(string&);
	string&	toString(string&) const;

protected:
	// managing dynamic storage
        void    makeSpace(int);   
	void	freeSpace();
	virtual void copyFrom(const UiList&);

private:
	int	nn;			///< list defined on ints in {1,...,nn}
	item	head;			///< first item in list
	item	tail;			///< last item in list
	item	*nxt;			///< nxt[i] is successor of i in list
};

inline UiList& UiList::operator=(const UiList& original) {
	copyFrom(original); return *this;
}

/** Get the next item in a list.
 *  @param i is an item on the list
 *  @return the item that follows i, or 0 if there is no next item
 */
inline item UiList::next(item i) const {
        assert(member(i)); return nxt[i];
}

/** Get first item on list.
 *  @return the first item on the list or 0 if the list is empty
 */
inline item UiList::first() const { return head; }

/** Get the last item on list.
 *  @return the last item on the list or 0 if the list is empty
 */
inline item UiList::last() const { return tail; }

/** Get the largest value that can be stored in list.
 *  @return the largest value that can be stored in the list.
 */
inline item UiList::n() const { return nn; }

/** Test if a given item is valid for this UiList.
 *  @param i is an integer
 *  @return true if i is in range for this UiList.
 */
inline bool UiList::valid(item i) const { return 1 <= i && i <= n(); }

/** Test if list is empty.
 *  @return true if list is empty, else false.
 */
inline bool UiList::empty() const { return first() == 0; }

/** Test if an item is in the list.
 *  @param i is an item
 *  @return true if i is in the list, else false
 */
inline bool UiList::member(item i) const {
	if (!valid(i)) {
                stringstream ss; ss << "UiList::get(" << i << ")";
                string s = ss.str();
                throw IllegalArgumentException(s);
        }
	return nxt[i] != -1;
}

/** Add item to the front of the list.
 *  @param item to be added.
 *  @return true if the list was modified, else false
 */
inline bool UiList::addFirst(item i) { return insert(i,0); }

/** Add item to the end of the list.
 *  @param item to be added.
 *  @return true if the list was modified, else false
 */
inline bool UiList::addLast(item i) { return insert(i,last()); }

/** Remove the first item in the list.
 *  @return true if the list was modified, else false
 */
inline bool UiList::removeFirst() { return removeNext(0); }

#endif
