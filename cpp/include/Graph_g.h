/** @file Graph_g.cpp
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_G_H
#define GRAPH_G_H

#include "Graph.h"
#include "List_d.h"
#include "List_g.h"
#include "Dlists.h"

namespace grafalgo {

/** This class encapsulates data and methods used by algorithms to find an
 *  edge group coloring in bipartite graphs. It serves as a base class for
 *  several different algorithms.
 */
class Graph_g : public Graph {
public:
	Graph_g(int=2, int=1);
	~Graph_g();

	void	resize(int, int);
	void	expand(int, int);
	void	clear();
	void	copyFrom(const Graph_g&);

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
	bool	compare(int, int);
	void	sortGroups(vertex);

	friend istream& operator>>(istream&, Graph&);

	bool	readAdjList(istream&);
	string	edge2string(edge) const;
	string	group2string(edge) const;
	string	adjList2string(vertex) const;
        string	toDotString() const;
private:
	int	*gNum;		///< gNum[e] is group number for e
	Dlists *groups;		///< partitions edges by group number
	Dlists *inGroups;	///< partitions groups among inputs & free list
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
inline int Graph_g::degree(vertex u) const {
	return deg[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::groupCount(vertex u) const {
	return gc[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::groupSize(int grp) const {
	return gs[grp];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxDegree() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxGroupCount() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxDegreeIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxDegreeOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,degree(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxGroupCountIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::maxGroupCountOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,groupCount(u));
	return D;
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::input(edge e) const {
	return left(e);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::output(edge e) const {
	return right(e);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::groupNumber(edge e) const { return gNum[e]; }

inline bool Graph_g::isIn(vertex u) const { return split->isIn(u); }

inline bool Graph_g::isOut(vertex u) const { return split->isOut(u); }

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::firstIn() const {
	return split->firstIn();
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::nextIn(vertex u) const {
	return split->nextIn(u);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::firstOut() const {
	return split->firstOut();
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::nextOut(vertex u) const {
	return split->nextOut(u);
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::firstGroup(vertex u) const {
	return fg[u];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::nextGroup(vertex u, int g) const {
	return (inGroups->next(g) == fg[u] ? 0 : inGroups->next(g));
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::firstEdgeInGroup(int g) const {
	return feg[g];
}

/** xxx
 *  @param xxx
 *  @returns xxx
 */
inline int Graph_g::nextEdgeInGroup(int g, edge e) const {
	return (groups->next(e) == feg[g] ? 0 : groups->next(e));
}

} // ends namespace

#endif
