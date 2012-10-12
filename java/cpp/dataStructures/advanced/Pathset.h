/** @file Pathset.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// Header file for path set data structure used to implement
// dynamic trees. Maintains a set of paths on nodes numbered
// {1,...,n}.

#ifndef PATHSET_H
#define PATHSET_H

#include "stdinc.h"
#include "Util.h"

typedef int path;		// path
typedef int node;		// node in path
typedef int cost;
struct PathCostPair { node s; cost c;};	// pair returned by findpathcost
struct PathPair { path s1, s2;};	// pair returned by split

/** Data structure that represents a collection of paths.
 *  Paths are defined on nodes numbered 1..n where n is specified when
 *  the object is constructed.  Each path has a "canonical element" which
 *  serves to represent the path in method calls. Internally, paths are
 *  represented as binary search trees and the roots of the BSTs serve
 *  as the canonical elements. Note that the canonical element of a tree
 *  may change if method calls restructure the underlying tree.
 */
class Pathset {
public: 	Pathset(int);
		~Pathset();

	path	findpath(node);		
	node	findtail(path);	
	PathCostPair findpathcost(path); 
	node	findtreeroot(node);	
	cost	nodeCost(node) const;

	void	addpathcost(path,cost);
	path	join(path,node,path);
	PathPair split(node);	

	string& path2string(path, string&) const;
	string& pathTree2string(path, string&) const;
	string& toString(string&) const;
protected:
	int	n;			///< Pathset defined on {1,...,n}
	struct PathNode {
	node	left, right, p;		// /<left child, right child, parent
	cost	dcost, dmin;		// /<delta cost and delta min
	};
	PathNode *pnode;		///< pnode[u] contains info for node u

	node	splay(node);
	void	splaystep(node);
	void	rotate(node);
};

#endif
