/** @file Graph_wd.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_W_D_H
#define GRAPH_W_D_H

#include "Graph_d.h"

namespace grafalgo {

typedef int edgeLength;

/** Data structure for directed graph with edge lengths.
 *
 *  Graph_wd size (number of vertices and max number of edges) must
 *  be specified when a Graph_wd object is instantiated.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Graph_wd : public Graph_d {
public:		Graph_wd(int=1,int=1);
		~Graph_wd();
	
	void	resize(int, int);
	void	resize(int numv) { resize(numv, numv); }
	void	expand(int, int);
	void	expand(int numv) { expand(numv, max(numv,m())); }
	virtual void copyFrom(const Graph_wd&);

	// methods for accessing/changing length
        edgeLength length(edge) const;
        void    setLength(edge,edgeLength);

	// create a string representation
        string	edge2string(edge) const;
        string	toDotString() const;

private:
	int	*len;			///< len[e] is length of edge e

	void makeSpace(int,int);
	void freeSpace();
	bool	readAdjList(istream&);
        string	adjList2string(vertex) const;

	Graph_wd& operator=(const Graph_wd&);

	friend class Rgraph;
};

/** Get the length of an edge.
 *  @param e is the edge of interest
 *  @return the length of e
 */
inline edgeLength Graph_wd::length(edge e) const { return len[e]; }

/** Set the length of an edge.
 *  @param e is the edge of interest
 *  @param lng is the desired length
 */
inline void Graph_wd::setLength(edge e, edgeLength lng) { len[e] = lng; }

} // ends namespace

#endif
