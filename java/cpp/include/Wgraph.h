/** @file Wgraph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef WGRAPH_H
#define WGRAPH_H

#include "stdinc.h"
#include "Graph.h"

typedef int weight;

/** Data structure for undirected graph with edge weights.
 *
 *  Wgraph size (number of vertices and max number of edges) must
 *  be specified when a Wgraph object is instantiated.
 *  Edges can be added and removed from the graph.
 *  Methods are provided to facilitate graph traversal,
 *  either by iterating through all edges of the graph
 *  or all edges incident to a specific vertex.
 */
class Wgraph : public Graph {
public:		Wgraph(int=26,int=50);
		Wgraph(const Wgraph&);
		~Wgraph();

	virtual void resize(int, int);
	virtual void reset();
	virtual void copyFrom(const Wgraph&);

	// methods for accessing/changing weight
	int	weight(edge) const;
	void	setWeight(edge,int);

	virtual bool readEdge(istream&);

	// create a string representation
	virtual string& edge2string(edge,string&) const;
	virtual string& edge2string(edge,vertex,string&) const;
        virtual string& toDotString(string&) const;

	void randWeight(int, int);
private:
	int	*wt;			///< weight of the edge
	void makeSpace(int,int);
	void freeSpace();

	Wgraph& operator=(const Wgraph&);
};

/** Get the weight of an edge.
 *  @param e is the edge of interest
 *  @return the weight of e, or 0 if e is not a valid edge.
 */
inline int Wgraph::weight(edge e) const {
	assert(0 <= e && e <= maxEdge);
	return (evec[e].l == 0 ? 0 : wt[e]);
}

/** Set the weight of an edge.
 *  @param e is the edge of interest
 *  @param w is the desired weight
 */
inline void Wgraph::setWeight(edge e, int w) {
	assert(0 <= e && e <= maxEdge); wt[e] = w;
}

#endif
