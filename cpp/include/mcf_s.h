/** @file mcf_s.h
 * 
 *  @author Jon Turner
 *  @date 2013
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MCF_S_H
#define MCF_S_H

#include "stdinc.h"
#include "Graph_wf.h"
#include "List_d.h"
#include "Heap_d.h"

namespace grafalgo {

/** The mcf_s class encapsulates data and methods used by the scaling
 *  version of the augmenting path algorithm for the min cost flow problem.
 *  Use constructor to invoke algorithm.
 */
class mcf_s {
public: mcf_s(Graph_wf&);       

private:
	Graph_wf* wfg;	 	// graph we're finding flow on
	int*    lab;	    	// lab[u]=distance label for transformed costs
	int*    excess;	 	// excess[u]=excess flow entering u
	List_d*   slist;	 	// Source vertices
	List_d*   tlist;	 	// Sink vertices
	edge	*pEdge;		// pEdge[u] connects to u's parent in spt
	int     Delta;	  	// Current scaling factor

	vertex  findpath(); 	// find augmenting path
	void augment(vertex);	// add flow to augmenting path
	void    newPhase();     // prepare for a new phase
	void    initLabels();   // assign initial values to labels
};

} // ends namespace

#endif
