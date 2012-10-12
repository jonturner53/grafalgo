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
#include "Util.h"
#include "Pathset.h"

typedef int tree;
struct PathNodePair { path p; node i;};
typedef PathCostPair NodeCostPair;

/** This class implements a collection trees.
 *  The trees are defined on nodes with node numbers 1..n where n is
 *  specified when the object is constructed. Each node is in one tree
 *  at a time. Each node has an integer cost and methods are provided
 *  for restructuring trees and manipulating costs
 */
class Dtrees {
public: 	Dtrees(int=100);
		~Dtrees();
	node	findroot(node);	
	NodeCostPair findcost(path);
				
	void	addcost(node,cost);
	void	link(tree,node);
	void	cut(node);

	cost	nodeCost(node) const;
	node	parent(node) const;

	string& path2string(path,string&) const;
	string& toString(string&) const;
private:
	int	n;			///< pathset defined on {1,...,n}
	node	*parentOf;		///< parentOf[i] is logical parent of i
	node	*successor;		///< succ[i] is link to next path
	Pathset *ps;			///< underlying path set data structure
	
	path	expose(node);
	PathNodePair splice(PathNodePair);
};

/** Get the parent of a node.
 *  @param i is a node in a tree
 *  @return the parent of i or 0 if i is at tree root
 */
inline node Dtrees::parent(node i) const { return parentOf[i]; }

/** Get the cost of a node.
 *  @param i is a node in a tree
 *  @return the cost of i
 */
inline cost Dtrees::nodeCost(node i) const { return ps->nodeCost(i); }

#endif
