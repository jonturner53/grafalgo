/** @file Partition.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */


#ifndef PARTITION_H
#define PARTITION_H

#include "Adt.h"

namespace grafalgo {

/** Maintain a partition on positive integers 1..n.
 *  Also known as "disjoint sets" and "union-find".
 */
class Partition : public Adt {
public:		Partition(int=26,int=0);
		~Partition();

	// common methods
	void	clear();
	void	clear(int);
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Partition&);

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
	void	makeSpace(int);
	void	freeSpace();
};

inline void Partition::clear(int u) {
	node[u].p = u; node[u].rank = 0;
}

} // ends namespace

#endif
