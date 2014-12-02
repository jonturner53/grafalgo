/** @file mcfCycRed.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// mcfCycRed class encapsulate data and routines used by cycle reduction
// algorithm for min cost flow. Users invoke algorithm with constructor.

#ifndef MCFCYCRED_H
#define MCFCYCRED_H

#include "stdinc.h"
#include "Wflograph.h"
#include "List.h"
#include "PathSet.h"
#include "Dtrees.h"
#include "dinicDtrees.h"

using namespace grafalgo;

/** This class encapsulates data and methods used by the cycle reduction
 *  algorithm for finding minimum colst flows.
 */
class mcfCycRed {
public: 	
		mcfCycRed(Wflograph&,flow&,cost&);
private:
	Wflograph* wfg;		// graph we're finding flow on
	edge*	pEdge;		// pEdge[u] is edge to parent of u in spt
	int*	mark;		// used by cycleCheck

	void augment(vertex);	// add flow to a cycle
	vertex findCyc();	// find negative cost cycle
	vertex cycleCheck();	// check for cycle in pEdge pointers
};

#endif
