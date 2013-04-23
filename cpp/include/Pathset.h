/** @file PathSet.h
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
#include "Adt.h"
#include "Util.h"

namespace grafalgo {

typedef int path;		// path
typedef int cost;

/** Data structure that represents a collection of paths.
 *  Paths are defined on nodes identified by index values.
 *  Each path has a "canonical element" which
 *  serves to represent the path in method calls. Internally, paths are
 *  represented as binary search trees and the roots of the BSTs serve
 *  as the canonical elements. Note that the canonical element of a tree
 *  may change if method calls restructure the underlying tree.
 */
class PathSet : public Adt {
public: 	PathSet(int,int*);
		~PathSet();

	struct PathCostPair {
		index x; cost c;
		PathCostPair(index xx, cost cc) : x(xx), c(cc) {}
	}; 
	struct PathPair {
		path p1, p2;
		PathPair(path pp1, path pp2) : p1(pp2), p2(pp2) {}
	}; 

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const PathSet&);

	path	findpath(index);		
	index	findtail(path);	
	PathCostPair findpathcost(path); 
	index	findtreeroot(index);	
	cost	nodeCost(index) const;

	void	addpathcost(path,cost);
	path	join(path,index,path);
	PathPair split(index);	

	string& path2string(path, string&) const;
	string& pathTree2string(path, string&) const;
	string& toString(string&) const;
protected:
	struct PathNode {
	index	left, right, p;		// /<left child, right child, parent
	cost	dcost, dmin;		// /<delta cost and delta min
	};
	PathNode *pnode;		///< pnode[u] contains info for node u
	int	*pvals;			///< pointer to vector of "path values"
					///< maintained by using application;
					///< PathSet updates whenever handle of
					///< a path changes
	index	splay(index);
	void	splaystep(index);
	void	rotate(index);

	void	makeSpace(int);
	void	freeSpace();
};

} // ends namespace

#endif
