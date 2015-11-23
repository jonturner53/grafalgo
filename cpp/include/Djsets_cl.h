/** @file Djsets_cl.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DJSETS_CL_H
#define DJSETS_CL_H

#include "stdinc.h"
#include "Adt.h"

namespace grafalgo {

/** This class represents a collection of lists defined over an
 *  underlying index set. The lists are doubly linked, enabling fast
 *  traversal in either direction, and fast remove operations.
 */
class Djsets_cl : public Adt {
public:		Djsets_cl(int);
		Djsets_cl();
		~Djsets_cl();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djsets_cl&);

	// list traversal methods
	int	next(index) const;
	int	prev(index) const;

	// modifiers
	void	join(index,index);
	void	remove(index);

	string&	toString(string&) const;
	string	toString() const;

private:
	struct lnode {
	int	succ;			// index of successor
	int	pred;			// index of predecessor
	} *node;

	void	makeSpace();
	void	freeSpace();
};

/** Get the successor of a list item.
 *  @param i is an index
 *  @return the index that follows i in its list
 */
inline index Djsets_cl::next(index i) const {
	assert(valid(i)); return node[i].succ;
}

/** Get the predecessor of a list item.
 *  @param i is an index
 *  @return the index that precedes i in its list
 */
inline index Djsets_cl::prev(index i) const {
	assert(valid(i)); return node[i].pred;
}

} // ends namespace

#endif
