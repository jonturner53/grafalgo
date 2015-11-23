/** @file Djsets_flt.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */


#ifndef DJSETS_FLT_H
#define DJSETS_FLT_H

#include "Adt.h"

namespace grafalgo {

/** Maintain a partition on positive integers 1..n.
 *  Also known as "disjoint sets" and "union-find".
 */
class Djsets_flt : public Adt {
public:		Djsets_flt(int=26);
		~Djsets_flt();

	// common methods
	void	clear();
	void	clear(index);
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djsets_flt&);

	index	link(index,index);
	index	find(index);

	string&	toString(string&) const;
	string 	toString() const;
private:
	struct	pnode {
	index	p;			///< parent of node
	int	rank;			///< rank of node
	} *node;			///< vector of nodes

	index	findroot(int) const;
	void	makeSpace();
	void	freeSpace();
};

/** Clear a single node in the data structure.
 *  This method provided for the use of match_egf algorithm.
 */
inline void Djsets_flt::clear(index u) {
        node[u].p = u; node[u].rank = 0;
}

} // ends namespace

#endif
