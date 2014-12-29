/** @file mcfScale.h
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MCFSCALE_H
#define MCFSCALE_H

#include "stdinc.h"
#include "Wflograph.h"
#include "Dlist.h"
#include "Dheap.h"

using namespace grafalgo;

/** The mcfScale class encapsulates data and methods used by the scaling
 *  version of the augmenting path algorithm for the min cost flow problem.
 *  Use constructor to invoke algorithm.
 */
class mcfScale {
public: mcfScale(Wflograph&);       

private:
	Wflograph* wfg;	 	// graph we're finding flow on
	int*    lab;	    	// lab[u]=distance label for transformed costs
	int*    excess;	 	// excess[u]=excess flow entering u
	Dlist*   slist;	 	// Source vertices
	Dlist*   tlist;	 	// Sink vertices
	edge	*pEdge;		// pEdge[u] connects to u's parent in spt
	int     Delta;	  	// Current scaling factor

	vertex  findpath(); 	// find augmenting path
	void augment(vertex);	// add flow to augmenting path
	void    newPhase();     // prepare for a new phase
	void    initLabels();   // assign initial values to labels
};
#endif
