/** @file Graph_f.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef GRAPH_F_H
#define GRAPH_F_H

#include "stdinc.h"
#include "Util.h"
#include "Graph_d.h"

namespace grafalgo {

typedef int flow;

/** Class that represents a flograph.
 *  Inherits methods from the Graph_d class and adds information and
 *  methods for dealing with flows and edge capacities
 */
class Graph_f : public Graph_d {
public:		Graph_f(int=3,int=2,int=1,int=2);
		Graph_f(const Graph_f&);
		virtual ~Graph_f();

	void	resize(int,int);
	void	resize(int numv) { resize(numv, numv); }
	void	expand(int,int);
	void	expand(int numv) { resize(numv, max(numv,m())); }
        void	copyFrom(const Graph_f&);

	// methods for accessing, setting source and sink
	vertex	src() const;
	vertex	snk() const;	
	void	setSrc(vertex);
	void	setSnk(vertex);

	// methods for dealing with flows
	flow	cap(vertex,edge) const;	
	flow	f(vertex,edge) const;
	virtual flow res(vertex,edge) const;
	void	addFlow(vertex,edge,flow); 
	void	setFlow(edge,flow); 
	void	clearFlow(); 
	void	setCapacity(edge,flow);	
	flow	totalFlow();

	virtual edge join(vertex,vertex);
	virtual edge joinWith(vertex,vertex,edge);

	string edge2string(edge) const;
	string toDotString() const;

protected:
	vertex	s, t;			///< source and sink vertices
	struct FloInfo {		///< flow and capacity of an edge
	flow	cpy;			///< edge capacity
	flow	flo;			///< flow on edge
	};
	FloInfo *floInfo;		///< floInfo[e] contains the flow
					///< information for edge e

	// various helper methods
        void    makeSpace(int,int);    	
        void    freeSpace();    		
	//void    virtual shuffle(int*, int*);   
	string	adjList2string(edge) const; 
	bool	readAdjList(istream&);

	Graph_f& operator=(const Graph_f&); 

	friend class Rgraph;
};

/** Get the source for a flograph.
 *  @return the source vertex
 */
inline vertex Graph_f::src() const { return s; }

/** Get the sink for a flograph.
 *  @return the sink vertex
 */
inline vertex Graph_f::snk() const { return t; }

/** Get the capacity of an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the capacity of e, going from v to mate(v)
 */
inline flow Graph_f::cap(vertex v, edge e) const { 
	return tail(e) == v ? floInfo[e].cpy : 0;
}

/** Get the flow on an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the flow on e, going from v to mate(v)
 */
inline flow Graph_f::f(vertex v, edge e) const {
	return tail(e) == v ? floInfo[e].flo : -floInfo[e].flo;
}

/** Get the residual capacity of an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the unused capacity of e, going from v to mate(v)
 */
inline flow Graph_f::res(vertex v, edge e) const {
	return tail(e) == v ? floInfo[e].cpy - floInfo[e].flo : floInfo[e].flo;
}

/** Change the flow on an edge.
 *  @param e is an edge that is incident to v
 *  @param fval is the new flow on e from the tail to the head
 */
inline void Graph_f::setFlow(edge e, flow fval) {
        floInfo[e].flo = fval;
}

/** Change the capacity of an edge.
 *  @param e is an edge that is incident to v
 *  @param capp is the new edge capacity for e
 */
inline void Graph_f::setCapacity(edge e, flow capp) {
        floInfo[e].cpy = capp;
}

/** Set the source vertex.
 *  @param ss is the new source vertex
 */
inline void Graph_f::setSrc(vertex ss) { s = ss; }

/** Set the sink vertex.
 *  @param tt is the new sink vertex
 */
inline void Graph_f::setSnk(vertex tt) { t = tt; }

} // ends namespace

#endif
