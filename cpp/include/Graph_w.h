/** @file Graph_w.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_W_H
#define GRAPH_W_H

#include "stdinc.h"
#include "Graph.h"
#include "List_g.h"

namespace grafalgo {

typedef int edgeWeight;

/** Data structure for undirected graph with edge weights.
 *
 *  Graph_w size (number of vertices and max number of edges) must
 *  be specified when a Graph_w object is instantiated.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Graph_w : public Graph {
public:		Graph_w(int=1,int=1);
		~Graph_w();

	void	resize(int, int);
	void	resize(int numv) { resize(numv,numv); }
	void	expand(int, int);
	void	expand(int numv) { resize(numv,max(numv,m())); }
	void	copyFrom(const Graph_w&);

	// methods for accessing/changing weight
	edgeWeight weight(edge) const;
	edgeWeight weight(List_g<edge>) const;
	void	setWeight(edge,edgeWeight);

	// create a string representation
	using Graph::edge2string;
	string edge2string(edge, vertex) const;
        string toDotString() const;

private:
	edgeWeight *wt;			///< weight of the edge
	void makeSpace(int,int);
	void freeSpace();
	bool	readAdjList(istream&);
	string	adjList2string(vertex) const;

	friend class Rgraph;
};

/** Get the weight of an edge.
 *  @param e is the edge of interest
 *  @return the weight of e, or 0 if e is not a valid edge.
 */
inline edgeWeight Graph_w::weight(edge e) const {
	return (evec[e].l == 0 ? 0 : wt[e]);
}

/** Set the weight of an edge.
 *  @param e is the edge of interest
 *  @param w is the desired weight
 */
inline void Graph_w::setWeight(edge e, edgeWeight w) { wt[e] = w; }

} // ends namespace

#endif
