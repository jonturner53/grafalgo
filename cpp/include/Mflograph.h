/** @file Mflograph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLOGRAPH_H
#define MFLOGRAPH_H

#include "stdinc.h"
#include "Util.h"
#include "Flograph.h"

namespace grafalgo {

/** Class representing a flow graph with minimum flow constraints.
 *  Inherits many methods from the Flograph class and adds methods
 *  for dealing with min flow constraints.
 */
class Mflograph : public Flograph {
public:		Mflograph(int=3,int=2,int=1,int=2);
		virtual ~Mflograph();

	void	resize(int,int);	
	void	resize(int numv) { resize(numv,numv); }
	void	expand(int,int);	
	void	expand(int numv) { expand(numv,max(numv,m())); }
        void	copyFrom(const Mflograph&);

	flow 	res(vertex, edge) const;
	virtual edge join(vertex,vertex);

	flow	minFlo(edge) const;
	void	setMinFlo(edge,flow);

	string& edge2string(edge, string&) const;
	string& toDotString(string&) const;

protected:
	flow	*mflo;				///< mflo[e] is min flow for e

	// various helper methods
        void    makeSpace(int,int);    		
        void    freeSpace();    	
//	void    virtual shuffle(int*, int*);
	bool	readAdjList(istream&);
	string& adjList2string(vertex,string&) const; 

private:
	Mflograph& operator=(const Mflograph&); 
};

/** Return cost of an edge.
 *  @param v is a vertex
 *  @param e is an edge that is incident to v
 *  @return the cost of e in the direction from v to mate(v)
 */
inline flow Mflograph::minFlo(edge e) const { 
	assert(1 <= e && e <= m());
	return mflo[e];
}

/** Set the min flow constraint of an edge.
 *  @param e is an edge
 *  @param c is a new min flow contraint to be assigned to e;
 *  if the specified c is smaller than the max edge capacity,
 *  the min flow contraint is set equal to the max capacity
 */
inline void Mflograph::setMinFlo(edge e, flow c) { 
	assert(1 <= e && e <= m());
	mflo[e] = min(c,cap(tail(e),e));
}

/** Get the residual capacity of an edge.
 *  @param v is a vertex in the flograph
 *  @param e is an edge that is incident to v
 *  @return the unused capacity of e, going from v to mate(v)
 */
inline flow Mflograph::res(vertex v, edge e) const {
        assert(1 <= v && v <= n() && 1 <= e && e <= m());
        return tail(e) == v ? floInfo[e].cpy - floInfo[e].flo
			    : floInfo[e].flo - mflo[e];
}

} // ends namespace

#endif
