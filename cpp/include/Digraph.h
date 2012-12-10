/** @file Digraph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef DIGRAPH_H
#define DIGRAPH_H

#include "Graph.h"

namespace grafalgo {

/** Data structure for undirected graph with edge weights.
 *
 *  Digraph size (number of vertices and max number of edges) must
 *  be specified when a Digraph object is constructed.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Digraph : public Graph {
public:		Digraph(int=26,int=50);
		~Digraph();
	
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

	virtual edge joinWith(vertex,vertex,edge);

        void    rgraph(int,int);    
        void    rdag(int,int);     

	// create a string representation
	string& adjList2string(vertex, string&) const;
	//virtual string& edge2string(edge,string&) const;
        virtual string& toDotString(string&) const;

	// input
	bool	readAdjList(istream&);
	//virtual bool read(istream&);


protected:
	void makeSpace(int,int);
	void freeSpace();

private:
	edge	*fi;		///< fi[u] is first in edge
	Digraph& operator=(const Digraph&);
};

/** Get the tail (starting point) of a directed edge.
 *  @param e is an edge
 *  @return the tail of the edge (if e=(u,v), u is the tail, v the head)
 */
inline edge Digraph::tail(edge e) const { return left(e); }

/** Get the head (starting point) of a directed edge.
 *  @param e is an edge
 *  @return the head of the edge (if e=(u,v), v is the head)
 */
inline edge Digraph::head(edge e) const { return right(e); }

/** Get the first edge incident to a vertex.
 *  @param v is the the vertex of interest
 *  @return the first edge incident to v
 */
inline edge Digraph::firstAt(vertex v) const {
        assert(validVertex(v));
        return (fi[v] != 0 ? fi[v]/2 : firstOut(v));
}

/** Get the next edge incident to a specific vertex.
 *  @param v is the edge whose adjacency list we're accessing
 *  @param e is the edge whose successor is requested
 *  @return the next edge incident to e (either in or out)
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Digraph::nextAt(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        int ff = adjLists->suc(ee);
        return (ff == fi[v] ? firstOut(v) : (ff == fe[v] ? 0 : ff/2));
}

/** Get the first edge incident to a vertex.
 *  @param v is the the vertex of interest
 *  @return the first edge incident to v
 */
inline edge Digraph::firstIn(vertex v) const {
        assert(validVertex(v));
        return fi[v]/2;
}

/** Get the next incoming edge incident to a specific vertex.
 *  @param v is a vertex whose edges we're iterating through
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the adjacency list for v
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Digraph::nextIn(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        int ff = adjLists->suc(ee);
        return (fi[v] == ff ? 0 : ff/2);
}

/** Get the first edge leaving a specified vertex.
 *  @param v is the the vertex of interest
 *  @return the first outgoing edge incident to v
 */
inline edge Digraph::firstOut(vertex v) const {
        assert(validVertex(v));
        return fe[v]/2;
}

/** Get the next outgoing edge incident to a specific vertex.
 *  @param v is the edge whose adjacency list we're accessing
 *  @param e is the edge whose successor is requested
 *  @return the next edge in the adjacency list for v
 *  or 0 if e is not incident to v or is the last edge on the list
 */
inline edge Digraph::nextOut(vertex v, edge e) const {
	assert(validVertex(v) && validEdge(e));
        if (v != evec[e].l && v != evec[e].r) return 0;
        int ee = (v == evec[e].l ? 2*e : 2*e+1);
        int ff = adjLists->suc(ee);
        return (fe[v] == ff ? 0 : ff/2);
}

} // ends namespace

#endif
