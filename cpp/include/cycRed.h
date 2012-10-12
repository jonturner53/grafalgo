// cycRed class encapsulate data and routines used by cycle reduction
// algorithm for min cost flow. Users invoke algorithm with constructor.

#ifndef CYCRED_H
#define CYCRED_H

#include "stdinc.h"
#include "Wflograph.h"
#include "UiList.h"
#include "Pathset.h"
#include "Dtrees.h"
#include "dinicDtrees.h"

class cycRed {
public: 	
		cycRed(Wflograph&,flow&,cost&);
private:
	Wflograph* wfg;		// graph we're finding flow on
	edge*	pEdge;		// pEdge[u] is edge to parent of u in spt
	int*	mark;		// used by cycleCheck

	void augment(vertex);	// add flow to a cycle
	vertex findCyc();	// find negative cost cycle
	vertex cycleCheck();	// check for cycle in pEdge pointers
};

#endif
