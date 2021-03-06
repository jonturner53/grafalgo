/** @file Graph_d.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_D_H
#define GRAPH_D_H

#include "Graph.h"

namespace grafalgo {

/** Data structure for directed graph.
 *
 *  Vertices are identified by index values 1..n.
 *  Edges are identified by separate index values over range 1..M.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Graph_d : public Graph {
public:		Graph_d(int=1,int=1);
		~Graph_d();
	
	void	resize(int,int);
	void	resize(int numv) { resize(numv,numv); }
	void	expand(int,int);
	void	expand(int numv) { resize(numv,max(numv,m())); }

	vertex  tail(edge) const;       
        vertex  head(edge) const;      

	virtual edge firstAt(vertex) const;  	
	virtual edge nextAt(vertex,edge) const;
	edge    firstIn(vertex) const;  
	edge    nextIn(vertex,edge) const; 
        edge    firstOut(vertex) const; 
        edge    nextOut(vertex,edge) const;

	edge	joinWith(vertex,vertex,edge);
	bool	remove(edge);

	// create a string representation
        virtual string toDotString() const;

protected:
	void makeSpace(int,int);
	void freeSpace();
	void init();
	string	adjList2string(vertex) const;
	bool	readAdjList(istream&);

private:
	edge	*fi;		///< fi[u] is first in edge

	friend class Rgraph;
};

/** Get the tail (starting point) of a directed edge.
 *  @param e is an edge
 *  @return the tail of the edge (if e=(u,v), u is the tail, v the head)
 */
inline edge Graph_d::tail(edge e) const { return left(e); }

/** Get the head (ending point) of a directed edge.
 *  @param e is an edge
 *  @return the head of the edge (if e=(u,v), v is the head)
 */
inline edge Graph_d::head(edge e) const { return right(e); }

/** Get the first edge incident to a vertex.
 *  @param v is the the vertex of interest
 *  @return the first edge incident to v
 */
inline edge Graph_d::firstAt(vertex v) const {
        assert(validVertex(v));
        return (fi[v] != 0 ? fi[v]/2 : firstOut(v));
}

/** Get the next edge incident to a specific vertex.
 *  @param v is the edge whose adjacency list we're accessing
 *  @param e is the edge whose successor is requested
 *  @return the next edge incident to e (either in or out)
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Graph_d::nextAt(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        int ff = adjLists->next(ee);
        return (ff == 0 && v == evec[e].r ? firstOut(v) : ff/2);
}

/** Get the first edge entering a vertex.
 *  @param v is the the vertex of interest
 *  @return the first edge incident to v
 */
inline edge Graph_d::firstIn(vertex v) const {
        assert(validVertex(v));
        return fi[v]/2;
}

/** Get the next incoming edge at a vertex.
 *  @param v is a vertex whose edges we're iterating through
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the adjacency list for v
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Graph_d::nextIn(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        return adjLists->next(ee)/2;
}

/** Get the first edge leaving a specified vertex.
 *  @param v is the the vertex of interest
 *  @return the first outgoing edge incident to v
 */
inline edge Graph_d::firstOut(vertex v) const {
        assert(validVertex(v));
        return fe[v]/2;
}

/** Get the next outgoing edge at a vertex.
 *  @param v is the edge whose adjacency list we're accessing
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the adjacency list for v
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Graph_d::nextOut(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        return adjLists->next(ee)/2;
}

} // ends namespace

#endif
