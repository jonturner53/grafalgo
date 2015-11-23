/** @file Djsets_lct.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DJSETS_LCT_H
#define DJSETS_LCT_H

#include "stdinc.h"
#include "Adt.h"
#include "Util.h"
#include "PathSet.h"

namespace grafalgo {

typedef int tree;
typedef PathSet::PathCostPair NodeCostPair;

/** This class implements a collection trees.
 *  The trees are defined on nodes with node numbers 1..n where n is
 *  specified when the object is constructed. Each node is in one tree
 *  at a time. Each node has an integer cost and methods are provided
 *  for restructuring trees and manipulating costs
 */
class Djsets_lct : public Adt {
public: 	Djsets_lct(int=100);
		~Djsets_lct();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Djsets_lct&);

	index	findroot(index);	
	NodeCostPair findcost(path);
	void	addcost(index,cost);
	void	link(tree,index);
	void	cut(index);

	cost	nodeCost(index) const;

	string	path2string(path) const;
	string 	toString() const;

private:
	index	*successor;		///< successor[i] is link to next path
	PathSet *ps;			///< underlying path set data structure
	
	struct PathNodePair {
		path p; index i;
		PathNodePair(path pp, index ii) : p(pp), i(ii) {}
	};
	path	expose(index);
	PathNodePair splice(PathNodePair);

	void	makeSpace();
	void	freeSpace();
};

/** Get the cost of a node.
 *  @param i is a node in a tree
 *  @return the cost of i
 */
inline cost Djsets_lct::nodeCost(index i) const { return ps->nodeCost(i); }

} // ends namespace

#endif
