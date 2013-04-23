/** @file Dtrees.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DTREES_H
#define DTREES_H

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
class Dtrees : public Adt {
public: 	Dtrees(int=100);
		~Dtrees();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Dtrees&);

	index	findroot(index);	
	NodeCostPair findcost(path);
	void	addcost(index,cost);
	void	link(tree,index);
	void	cut(index);

	cost	nodeCost(index) const;
	index	parent(index) const;

	string& path2string(path,string&) const;
	string& toString(string&) const;

private:
	index	*parentOf;		///< parentOf[i] is logical parent of i
	index	*successor;		///< successor[i] is link to next path
	PathSet *ps;			///< underlying path set data structure
	
	struct PathNodePair {
		path p; index i;
		PathNodePair(path pp, index ii) : p(pp), i(ii) {}
	};
	path	expose(index);
	PathNodePair splice(PathNodePair);

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the parent of a node.
 *  @param i is a node in a tree
 *  @return the parent of i or 0 if i is at tree root
 */
inline index Dtrees::parent(index i) const { return parentOf[i]; }

/** Get the cost of a node.
 *  @param i is a node in a tree
 *  @return the cost of i
 */
inline cost Dtrees::nodeCost(index i) const { return ps->nodeCost(i); }

} // ends namespace

#endif
