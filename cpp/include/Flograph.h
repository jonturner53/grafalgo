/** @file Flograph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef FLOGRAPH_H
#define FLOGRAPH_H

#include "stdinc.h"
#include "Util.h"
#include "Digraph.h"

namespace grafalgo {

typedef int flow;

/** Class that represents a flograph.
 *  Inherits methods from the Digraph class and adds information and
 *  methods for dealing with flows and edge capcities
 */
class Flograph : public Digraph {
public:		Flograph(int=26,int=100,int=1,int=2);
		Flograph(const Flograph&);
		virtual ~Flograph();

	void	resize(int,int);
	void	resize(int numv) { resize(numv, numv); }
	void	expand(int,int);
	void	expand(int numv) { resize(numv, max(numv,m())); }
        void	copyFrom(const Flograph&);

	// methods for accessing, setting source and sink
	vertex	src() const;
	vertex	snk() const;	
	void	setSrc(vertex);
	void	setSnk(vertex);

	// methods for dealing with flows
	flow	cap(vertex,edge) const;	
	flow	f(vertex,edge) const;
	flow	res(vertex,edge) const;
	void	addFlow(vertex,edge,flow); 
	void	setFlow(edge,flow); 
	void	clearFlow(); 
	void	setCapacity(edge,flow);	

	virtual edge join(vertex,vertex);

	bool	readAdjList(istream&);
	//virtual bool readEdge(istream&);
	//virtual bool read(istream&);
	string&	adjList2string(edge,string&) const; 
	string& toDotString(string&) const;

	void	randCapacity(flow, flow);	
	void	rgraph(int, int, int);
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
	void    virtual shuffle(int*, int*);   

	Flograph& operator=(const Flograph&); 
};

/** Get the source for a flograph.
 *  @return the source vertex
 */
inline vertex Flograph::src() const { return s; }

/** Get the sink for a flograph.
 *  @return the sink vertex
 */
inline vertex Flograph::snk() const { return t; }

/** Get the capacity of an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the capacity of e, going from v to mate(v)
 */
inline flow Flograph::cap(vertex v, edge e) const { 
	assert(1 <= v && v <= n() && 1 <= e && e <= m());
	return tail(e) == v ? floInfo[e].cpy : 0;
}

/** Get the flow on an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the flow on e, going from v to mate(v)
 */
inline flow Flograph::f(vertex v, edge e) const {
	assert(1 <= v && v <= n() && 1 <= e && e <= m());
	return tail(e) == v ? floInfo[e].flo : -floInfo[e].flo;
}

/** Get the residual capacity of an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the unused capacity of e, going from v to mate(v)
 */
inline flow Flograph::res(vertex v, edge e) const {
	assert(1 <= v && v <= n() && 1 <= e && e <= m());
	return tail(e) == v ? floInfo[e].cpy - floInfo[e].flo : floInfo[e].flo;
}

/** Change the flow on an edge.
 *  @param e is an edge that is incident to v
 *  @param fval is the new flow on e from the tail to the head
 */
inline void Flograph::setFlow(edge e, flow fval) {
        assert(1 <= e && e <= m());
        floInfo[e].flo = fval;
}

/** Change the capacity of an edge.
 *  @param e is an edge that is incident to v
 *  @param capp is the new edge capacity for e
 */
inline void Flograph::setCapacity(edge e, flow capp) {
        assert(1 <= e && e <= m());
        floInfo[e].cpy = capp;
}

/** Set the source and sink vertices.
 *  @param ss is the new source vertex
 */
inline void Flograph::setSrc(vertex ss) { s = ss; }

/** Set the source and sink vertices.
 *  @param tt is the new sink vertex
 */
inline void Flograph::setSnk(vertex tt) { t = tt; }

} // ends namespace

#endif
