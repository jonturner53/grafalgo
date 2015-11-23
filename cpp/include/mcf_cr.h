/** @file mcf_cr.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// mcf_cr class encapsulate data and routines used by cycle reduction
// algorithm for min cost flow. Users invoke algorithm with constructor.

#ifndef MCF_CR_H
#define MCF_CR_H

#include "stdinc.h"
#include "Graph_wf.h"
#include "List.h"
#include "PathSet.h"
#include "Djsets-lct.h"
#include "mflo_dDjsets-lct.h"

namespace grafalgo {

/** This class encapsulates data and methods used by the cycle reduction
 *  algorithm for finding minimum colst flows.
 */
class mcf_cr {
public: 	
		mcf_cr(Graph_wf&);
private:
	Graph_wf* wfg;		// graph we're finding flow on
	edge*	pEdge;		// pEdge[u] is edge to parent of u in spt
	int*	mark;		// used by cycleCheck

	void augment(vertex);	// add flow to a cycle
	vertex findCyc();	// find negative cost cycle
	vertex cycleCheck();	// check for cycle in pEdge pointers
};

} // ends namespace

#endif
