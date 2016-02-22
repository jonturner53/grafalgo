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

/** Get the degree of a vertex.
 *  @param[in] u is a vertex
 *  @returns return the number of edges incident to u
 */
inline int Graph_g::degree(vertex u) const {
	return deg[u];
}

/** Get the number of groups at a vertex.
 *  @param[in] u is a vertex
 *  @returns the number of groups that have an edge incident to u
 */
inline int Graph_g::groupCount(vertex u) const {
	return gc[u];
}

/** Get the size of a group.
 *  @param[in] grp is a group number
 *  @returns the number of edges in the group
 */
inline int Graph_g::groupSize(int grp) const {
	return gs[grp];
}

/** Determine the maximum vertex degree.
 *  @returns the largest vertex degree
 */
inline int Graph_g::maxDegree() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,degree(u));
	return D;
}

/** Determine the maximum group count.
 *  @returns the largest group count
 */
inline int Graph_g::maxGroupCount() const {
	int D = 0;
	for (vertex u = 1; u <= n(); u++) D = max(D,groupCount(u));
	return D;
}

/** Determine the maximimum degree among the inputs.
 *  @returns the largest vertex degree over the input vertices
 */
inline int Graph_g::maxDegreeIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,degree(u));
	return D;
}

/** Determine the maximum degree among the outputs
 *  @returns the largest vertex degree among the outputs
 */
inline int Graph_g::maxDegreeOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,degree(u));
	return D;
}

/** Determine the maximimum group count among the inputs.
 *  @returns the largest group count over the input vertices
 */
inline int Graph_g::maxGroupCountIn() const {
	int D = 0;
	for (vertex u = firstIn(); u != 0; u = nextIn(u))
		D = max(D,groupCount(u));
	return D;
}

/** Determine the maximimum group count among the outputs.
 *  @returns the largest group count over the output vertices
 */
inline int Graph_g::maxGroupCountOut() const {
	int D = 0;
	for (vertex u = firstOut(); u != 0; u = nextOut(u))
		D = max(D,groupCount(u));
	return D;
}

/** Get the input vertex for a given edge.
 *  @param[in] e is an edge
 *  @returns returns the input vertex in e
 */
inline int Graph_g::input(edge e) const {
	return left(e);
}

/** Get the output vertex for a given edge.
 *  @param[in] e is an edge
 *  @returns returns the output vertex in e
 */
inline int Graph_g::output(edge e) const {
	return right(e);
}

/** Get the group number for a given edge.
 *  @param[in] e is an edge
 *  @returns returns the number of the group containing e
 */
inline int Graph_g::groupNumber(edge e) const { return gNum[e]; }

/** Determine if a vertex is an input.
 *  @param[in] u is a vertex
 *  @returns true if u is an input, else false
 */
inline bool Graph_g::isIn(vertex u) const { return split->isIn(u); }

/** Determine if a vertex is an output.
 *  @param[in] u is a vertex
 *  @returns true if u is an output, else false
 */
inline bool Graph_g::isOut(vertex u) const { return split->isOut(u); }

/** Get the first input vertex.
 *  @returns the index of the first input vertex
 */
inline int Graph_g::firstIn() const {
	return split->firstIn();
}

/** Get the next input vertex.
 *  @param[in] u is an input vertex
 *  @returns the index of the next input vertex following u
 */
inline int Graph_g::nextIn(vertex u) const {
	return split->nextIn(u);
}

/** Get the first output vertex.
 *  @returns the index of the first output vertex
 */
inline int Graph_g::firstOut() const {
	return split->firstOut();
}

/** Get the next output vertex.
 *  @param[in] u is an output vertex
 *  @returns the index of the next output vertex following u
 */
inline int Graph_g::nextOut(vertex u) const {
	return split->nextOut(u);
}

/** Get the number of the first group at an input.
 *  @param[in] u is an input vertex
 *  @returns the index of the first group with an edge incident to u
 */
inline int Graph_g::firstGroup(vertex u) const {
	return fg[u];
}

/** Get the number of the next group at an input.
 *  @param[in] u is an input vertex
 *  @param[in] grp is the number of a group with an edge incident to u
 *  @returns the index of the next group at u, after grp
 */
inline int Graph_g::nextGroup(vertex u, int g) const {
	return (inGroups->next(g) == fg[u] ? 0 : inGroups->next(g));
}

/** Get the number of the first edge in a group.
 *  @param[in] grp is a group number
 *  @returns the index of the first edge in grp
 */
inline int Graph_g::firstEdgeInGroup(int g) const {
	return feg[g];
}

/** Get the number of the next edge in a group.
 *  @param[in] grp is a group number
 *  @param[in] e is an edge in grp
 *  @returns the index of the next edge in grp, after e
 */
inline int Graph_g::nextEdgeInGroup(int g, edge e) const {
	return (groups->next(e) == feg[g] ? 0 : groups->next(e));
}

} // ends namespace

#endif
