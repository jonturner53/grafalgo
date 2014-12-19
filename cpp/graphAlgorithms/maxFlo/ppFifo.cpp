/** \file ppFifo.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ppFifo.h"

/** Find maximum flow in a flow graph using the fifo varaint of the 
 *  preflow-push algorithm.
 *  @param fg1 is a reference to the flow graph
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 */
ppFifo::ppFifo(Flograph& fg1, bool batch) : prePush(fg1) {
	unbal = new List(fg->n());
	if (batch) maxFlowBatch();
	else	   maxFlowIncr();
}

/** Add a vertex to the set of unbalanced vertices.
 *  This method is called from within the base class.
 *  @param u is a vertex that that is unbalanced; u may have been
 *  unbalanced previously as well
 */
void ppFifo::addUnbal(vertex u) {
	if (!unbal->member(u)) unbal->addLast(u);
}

/** Remove and return a vertex from the set of unbalanced vertices.
 *  This method is called from within the base class.
 *  @return an unbalanced vertex u or 0 if there are no unbalanced vertices;
 *  u is also removed from the data structure that represents unbalanced
 *  vertices, so if the caller cannot make it balanced, it should be
 *  added back to the set.
 */
vertex ppFifo::removeUnbal() {
	vertex u = unbal->first(); 
	if (u != 0) unbal->removeFirst();
	return u;
}
