/** @file GroupGraph.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GROUPGRAPH_H
#define GROUPGRAPH_H

#include "Graph.h"
#include "Dlist.h"
#include "Glist.h"
#include "ClistSet.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms to find an
 *  edge group coloring in bipartite graphs. It serves as a base class for
 *  several different algorithms.
 */
class GroupGraph : public Graph {
public:
	GroupGraph(int=2, int=1);
	~GroupGraph();

	void	resize(int, int);
	void	expand(int, int);
	void	clear();
	void	copyFrom(const GroupGraph&);

	int	numGroups() const;
	int	degree(vertex) const;
	int	groupCount(vertex) const;
	int	groupSize(int) const;
	int	maxDegree() const;
	int	maxDegreeIn() const;
	int	maxDegreeOut() const;
	int	maxGroupCount() const;
	int	maxGroupCountIn() const;
	int	maxGroupCountOut() const;

	int	input(edge) const;
	int	output(edge) const;
	int	groupNumber(edge) const;
	bool	isIn(vertex) const;
	bool	isOut(vertex) const;

	int	firstIn() const;
	int	nextIn(vertex) const;
	int	firstOut() const;
	int	nextOut(vertex) const;

	int	firstGroup(vertex) const;
	int	nextGroup(vertex,int) const;
	edge	firstEdgeInGroup(int) const;
	edge	nextEdgeInGroup(int, edge) const;

	edge	join(vertex, vertex);
	edge	join(vertex, vertex, int);
	edge	joinWith(vertex, vertex, edge);
	edge	joinWith(vertex, vertex, int, edge);
	int	merge(edge, edge);
	bool	remove(edge);

	friend istream& operator>>(istream&, Graph&);

	bool	readAdjList(istream&);
	string	edge2string(edge) const;
	string	adjList2string(vertex) const;
        string	toDotString() const;
private:
	int	ng;		///< number of edge groups
	int	*gNum;		///< gNum[e] is group number for e
	ClistSet *groups;	///< partitions edges by group number
	ClistSet *inGroups;	///< partitions groups among inputs & free list
	int	freeGroup;	///< group in list of free groups
	int	*fg;		///< fg[u] is first group at input u
	edge	*feg;		///< feg[g] is first edge in group g
	ListPair *split;	///< defines inputs and outputs
	int	*deg;		///< deg[u]=degree of u
	int	*gc;		///< gc[u]=group count at u
	int	*gs;		///< gs[g]=# of edges in group g

	void	makeSpace();
	void	init();
	void	freeSpace();

	friend class Rgraph;
};
/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::numGroups() const {
	return ng;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::degree(vertex u) const {
	return deg[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::groupCount(vertex u) const {
	return gc[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxDegree() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxGroupCount() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxDegreeIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxDegreeOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxGroupCountIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::maxGroupCountOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::input(edge e) const {
	return left(e);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::output(edge e) const {
	return right(e);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::groupNumber(edge e) const { return gNum[e]; }

inline bool GroupGraph::isIn(vertex u) const { return split->isIn(u); }
inline bool GroupGraph::isOut(vertex u) const { return split->isIn(u); }

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::firstIn() const {
	return split->firstIn();
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::nextIn(vertex u) const {
	return split->nextIn(u);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::firstOut() const {
	return split->firstOut();
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::nextOut(vertex u) const {
	return split->nextOut(u);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::firstGroup(vertex u) const {
	return fg[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::nextGroup(vertex u, int g) const {
	return (inGroups->next(g) == fg[u] ? 0 : inGroups->next(g));
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::firstEdgeInGroup(int g) const {
	return feg[g];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int GroupGraph::nextEdgeInGroup(int g, edge e) const {
	return (groups->next(e) == feg[g] ? 0 : groups->next(e));
}

} // ends namespace

#endif
