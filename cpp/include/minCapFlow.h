/** @file minCapFlow.cpp
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MINCAPFLOW_H
#define MINCAPFLOW_H

#include "stdinc.h"
#include "Mflograph.h"
#include "List.h"
#include "Dheap.h"

using namespace grafalgo;

/** MinCapFlow class. Encapsulates data and routines used to find
 *  a maximum flow in flographs with minimum flow constraints.
 */
class minCapFlow {
public: 
	minCapFlow(Mflograph&,int&);
	~minCapFlow();
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
