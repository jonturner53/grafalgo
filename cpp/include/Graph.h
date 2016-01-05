/** @file Graph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_H
#define GRAPH_H

#include "Adt.h"
#include "Util.h"
#include "List.h"
#include "Dlists.h"
#include "ListPair.h"
#include "List_g.h"
#include <list>
#include <vector>

namespace grafalgo {

typedef int32_t vertex;
typedef int32_t edge;

/** Data structure for undirected graph.
 *
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Graph : public Adt {
public:		Graph(int=2,int=1);
		~Graph();

	// common methods
	void	clear();
	void	resize(int numv) { resize(numv, numv); }
	virtual void resize(int, int);
	void	expand(int numv) { expand(numv, max(numv,m())); }
	virtual void expand(int, int);
	void	copyFrom(const Graph&);

	// number of edges
	int	m() const;	
	int	M() const;	

	// predicates
	bool	validVertex(int) const;
	bool	validEdge(int) const;

	// methods for iterating through overall edge list, adjacency lists
	edge	first() const;
	edge	next(edge) const;
	virtual edge firstAt(vertex) const;
	virtual edge nextAt(vertex,edge) const;

	// methods for accessing edge endpoints and length
	vertex	left(edge) const;	
	vertex	right(edge) const;	
	vertex	mate(vertex,edge) const;
	edge	findEdge(vertex,vertex) const;

	// methods for adding/removing edges
	virtual edge join(vertex,vertex); 	
	virtual edge joinWith(vertex,vertex,edge); 	
	virtual bool remove(edge);	

	// methods for computing properties
	int	degree(vertex) const;
	int	maxDegree() const;
	int	getComponents(int*) const;

	// input
	friend istream& operator>>(istream&, Graph&);

	// create a string representation
	virtual	string edge2string(edge) const;
	virtual	string edge2string(edge,vertex) const;
	virtual	string toString() const;
        virtual	string toDotString() const;
	virtual	string elist2string(list<edge>&) const;
	virtual	string elist2string(List_g<edge>&) const;
	virtual	string elist2string(List&) const;

	// sort adjacency lists by other endpont
	void	sortAdjLists();

	/// control output format
	void	showEdgeNum(bool sho) { shoEnum = sho; }

protected:
	edge	*fe;			///< fe[v] is first edge incident to v

	/** endpoints of an edge */
	struct EdgeInfo {
	vertex	l;			///< l is left endpoint of edge
	vertex	r;			///< r is right endpoint of edge
	};
	EdgeInfo *evec;			///< array of edge structures

	ListPair *edges; 		///< sets of in-use and free edges

	Dlists *adjLists;		///< set of edge adjacency lists
					///< each "edge endpoint" appears
					///< on one list; the endpoints
					///< for edge e are 2e and 2e+1
	bool	shoEnum;		///< if true, edge numbers are included
					///< in string representation

	// internal helper methods
	void	makeSpace(int, int);
	void	freeSpace();
	void	init();
	virtual bool readAdjList(istream&);
	virtual string adjList2string(vertex) const;

	// methods for sorting ajacency lists
	int	ecmp(edge, edge, vertex) const;
	void	sortAlist(vertex);

	friend class Rgraph;
};

/** Get the number of edges.
 *  @return the number of edges in the graph.
 */
inline int Graph::m() const { return edges->getNumIn(); }

/** Get the maximum allowed edge number.
 *  @return the maximum allowed edge number
 */
inline int Graph::M() const { return edges->n(); }

/** Determine if a vertex number is valid.
 *  @param u is the vertex number to be verified
 *  @return true if u is a valid vertex number, else false.
 */
inline bool Graph::validVertex(vertex u) const { return valid(u); }

/** Determine if an edge number corresponds to a valid edge.
 *  @param e is the edge number to be verified
 *  @return true if e is a valid edge number, else false.
 */
inline bool Graph::validEdge(edge e) const { return edges->isIn(e); }

/** Get the first edge in the overall list of edges.
 *  @return the first edge in the list
 */
inline edge Graph::first() const { return edges->firstIn(); }

/** Get the next edge in the overall list of edges.
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the list, or 0 if e is not in the list
 *  or it has no successor
 */
inline edge Graph::next(edge e) const { return edges->nextIn(e); }

/** Get the first edge incident to a vertex.
 *  @param v is the the vertex of interest
 *  @return the first edge incident to v
 */
inline edge Graph::firstAt(vertex v) const { 
	assert(validVertex(v));
	return fe[v]/2;
}

/** Get the next edge in the adjacency list for a specific vertex.
 *  @param v is the edge whose adjacency list we're accessing
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the adjacency list for v
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Graph::nextAt(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
	if (v != evec[e].l && v != evec[e].r) return 0;
	int ee = (v == evec[e].l ? 2*e : 2*e+1);
	int ff = adjLists->next(ee);
	return (fe[v] == ff ? 0 : ff/2);
}

/** Get the left endpoint of an edge.
 *  @param e is the edge of interest
 *  @return the left endpoint of e, or 0 if e is not a valid edge.
 */
inline vertex Graph::left(edge e) const {
if (!validEdge(e)) cerr << "left(" << e << ")\n";
	assert(validEdge(e));
	return evec[e].l;
}

/** Get the right endpoint of an edge.
 *  @param e is the edge of interest
 *  @return the right endpoint of e, or 0 if e is not a valid edge.
 */
inline vertex Graph::right(edge e) const {
	assert(validEdge(e));
	return (evec[e].l == 0 ? 0 : evec[e].r);
}

/** Get the other endpoint of an edge.
 *  @param v is a vertex
 *  @param e is an edge incident to v
 *  @return the other vertex incident to e, or 0 if e is not a valid edge
 *  or it is not incident to v.
 */
inline vertex Graph::mate(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
	if (v == 0 || e == 0) return 0;
	return (evec[e].l == 0 ?  0 :
		(v == evec[e].l ?  evec[e].r :
		 (v == evec[e].r ? evec[e].l : 0)));
}

} // ends namespace

#endif
