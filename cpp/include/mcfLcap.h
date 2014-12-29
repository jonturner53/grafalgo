/** @file mcfLcap.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MCFLCAP_H
#define MCFLCAP_H

#include "stdinc.h"
#include "Wflograph.h"
#include "List.h"
#include "Dheap.h"

using namespace grafalgo;

/** The mcfLcap class encapsulates data and methods used by the least cost
 *  augmenting path algorithm for min cost flow. Use constructor to invoke
 *  algorithm.
 */
class mcfLcap {
public:
	mcfLcap(Wflograph&, bool);
protected:
	Wflograph* wfg;		// graph we're finding flow on
	int*	lab;		// lab[u] is label used to transform costs
	edge*	pEdge;		// pEdge[u] is edge to parent of u in spt

	void pathRcapCost(flow&,floCost&); // return path res cap and cost
	void augment(flow&); 		// add flow to augmenting path
	void initLabels();	// initialize labels for transformed costs
	bool findpath();	// find a least cost augmenting path
};

#endif
