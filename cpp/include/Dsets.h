/** @file Dsets.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */


#ifndef DSETS_H
#define DSETS_H

#include "Adt.h"

namespace grafalgo {

/** Maintain a collection of disjoint sets on index set 1..n. */
class Dsets : public Adt {
public:		Dsets(int=26);
		~Dsets();

	// common methods
	void	clear();
	void	clear(index);
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Dsets&);

	index	link(index,index);
	index	find(index);

	string&	toString(string&) const;
	string 	toString() const;
private:
	/** node in the forest that implements the disjoint sets */
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
inline void Dsets::clear(index u) {
        node[u].p = u; node[u].rank = 0;
}

} // ends namespace

#endif
