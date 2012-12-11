/** MinFlow class. Encapsulates data and routines used to find
 *  a maximum flow in flographs with minimum flow constraints.
 */

#ifndef MINCAP_H
#define MINCAP_H

#include "stdinc.h"
#include "Mflograph.h"
#include "List.h"
#include "Dheap.h"

using namespace grafalgo;

class minFlow {
public: 
	minFlow(Mflograph&,int&);
	~minFlow();
protected:
        Mflograph* fg;       	// graph we're finding flow on
	edge *pEdge;		// pEdge[u] is edge to parent of u in the	
				// spt constructed by findPath or findCycle

	bool	findPath();	// find augenting path
        int   	augment();	// add flow to augmenting path
	bool	findCycle(edge); // find cycle
        int   	add2cycle(edge); // add flow to augmenting path
};

#endif
