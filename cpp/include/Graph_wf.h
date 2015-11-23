/** @file Graph_wf.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_W_F_H
#define GRAPH_W_F_H

#include "stdinc.h"
#include "Util.h"
#include "Graph_f.h"

namespace grafalgo {

typedef int floCost;

/** Class representing a weighted flow graph.
 *  Used in min cost flow problems.
 *  Inherits many methods from the Graph_f class and adds methods
 *  for dealing with edge costs.
 */
class Graph_wf : public Graph_f {
public:		Graph_wf(int=3,int=2,int=1,int=2);
		Graph_wf(const Graph_wf&);
		virtual ~Graph_wf();

	void	resize(int,int);	
	void	resize(int numv) { resize(numv,numv); }
	void	expand(int,int);	
	void	expand(int numv) { expand(numv,max(numv,m())); }
        void	copyFrom(const Graph_wf&);

	virtual edge join(vertex,vertex);

	floCost	cost(vertex,edge) const;
	void	setCost(edge,floCost);
	floCost totalCost() const;

	string	edge2string(edge) const;
	string	toDotString() const;

protected:
	floCost	*cst;				///< cst[e] is cost of e

	// various helper methods
        void    makeSpace(int,int);    		
        void    freeSpace();    	
	//void    virtual shuffle(int*, int*);
	bool	readAdjList(istream&);
	string	adjList2string(vertex) const; 

	friend class Rgraph;
};

/** Return cost of an edge.
 *  @param v is a vertex
 *  @param e is an edge that is incident to v
 *  @return the cost of e in the direction from v to mate(v)
 */
inline flow Graph_wf::cost(vertex v, edge e) const { 
	return tail(e) == v ? cst[e] : -cst[e];
}

/** Set the cost of an edge.
 *  @param e is an edge
 *  @param c is a new cost to be assigned to e
 */
inline void Graph_wf::setCost(edge e, floCost c) { cst[e] = c; }

} // ends namespace

#endif
