/** @file Partition.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */


#ifndef PARTITION_H
#define PARTITION_H

#include "stdinc.h"
#include "Util.h"

typedef int item;

/** Maintain a partition on positive integers 1..n.
 *  Also known as "disjoint sets" and "union-find".
 */
class Partition {
public:		Partition(int=26,int=0);
		~Partition();

	item	link(item,item);
	item	find(item);
	long long int findcount() const;
	void	clear();
	void	clear(int);

	string&	toString(string&) const;
private:
	int	n;			///< partition defined over {1,...,n}
	struct	pnode {
	item	p;			///< parent of node
	int	rank;			///< rank of node
	} *node;			///< vector of nodes
	long long int nfind;		///< number of find steps
	int	noOpt;			///< if =1 skip path compression
					///< if =2 skip link-by-rank
					///< if =3 skip both

	item	findroot(int) const;
};

/** Get the number of "find steps" that have been performed so far.
 *  @return the number of find steps.
 */
inline long long int Partition::findcount() const { return nfind; }

inline void Partition::clear(int u) {
	node[u].p = u; node[u].rank = 0;
}

#endif
