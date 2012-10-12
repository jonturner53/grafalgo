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

typedef int flow;

/** Class that represents a flograph.
 *  Inherits methods from the Digraph class and adds information and
 *  methods for dealing with flows and edge capcities
 */
class Flograph : public Digraph {
public:		Flograph(int=26,int=100,int=1,int=2);
		Flograph(const Flograph&);
		virtual ~Flograph();

	virtual void resize(int,int);
	virtual void reset();
        virtual void copyFrom(const Flograph&);

	// methods for accessing, setting source and sink
	vertex	src() const;
	vertex	snk() const;	
	void	setSrcSnk(vertex, vertex);

	// methods for dealing with flows
	flow	cap(vertex,edge) const;	
	flow	f(vertex,edge) const;
	flow	res(vertex,edge) const;
	flow	addFlow(vertex,edge,flow); 
	void	setCapacity(edge,flow);	
	void	clear();

	virtual edge join(vertex,vertex);

	virtual bool readEdge(istream&);
	virtual bool read(istream&);
	virtual string& edge2string(edge,string&) const; 
	string& toString(string&) const;
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

/** Change the capacity of an edge.
 *  @param e is an edge that is incident to v
 *  @param capp is the new edge capacity for e
 */
inline void Flograph::setCapacity(edge e, flow capp) {
        assert(1 <= e && e <= M);
        floInfo[e].cpy = capp;
}

/** Set the source and sink vertices.
 *  @param s1 is the new source vertex
 *  @param s2 is the new sink vertex
 */
inline void Flograph::setSrcSnk(vertex s1, vertex t1) {
	s = s1; t = t1;
}

#endif
