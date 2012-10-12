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
 *  @param floVal is a reference to an integer variable in which the
 *  maximum flow value is returned
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 */
ppFifo::ppFifo(Flograph& fg1, int& floVal, bool batch) : prePush(fg1,floVal) {
	doit(batch); floVal = flowValue();
}

/** Find maximum flow in a flow graph using the fifo varaint of the 
 *  preflow-push algorithm.
 *  @param fg1 is a reference to the flow graph
 *  @param floVal is a reference to an integer variable in which the
 *  maximum flow value is returned
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 *  @param stats is a reference to a string in which the statistics
 *  information is returned
 */
ppFifo::ppFifo(Flograph& fg1, int& floVal, bool batch, string& stats)
		: prePush(fg1,floVal) {
	doit(batch); floVal = flowValue();
	stringstream ss;
	ss << satCount << " " << nonSatCount << " " << newDistCount
	   << " " << relabCount;
	stats = ss.str();
}

/** Helper method that implements the core algorithm common two
 *  the two different constructors.
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 */
void ppFifo::doit(bool batch) {
	unbal = new UiList(fg->n());

	// initialization
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextOut(s,e)) {
                vertex v = fg->head(e);
                if (v != fg->snk()) unbal->addLast(v); 
        }

	vertex u;
	if (!batch) { // incremental relabeling
     		while (!unbal->empty()) {
			u = unbal->first(); unbal->removeFirst();
			if (!balance(u)) {
				d[u] = 1 + minlabel(u);
				nextedge[u] = fg->firstAt(u);
				unbal->addLast(u);
				relabCount++;
			}
		}
	} else { // batch relabeling
	     	while (!unbal->empty()) {
	     		while (!unbal->empty()) {
				u = unbal->first(); unbal->removeFirst();
				balance(u);
			}
	                initdist();
	                for (u = 1; u <= fg->n(); u++) {
				if (u == fg->src() || u == fg->snk()) continue;
	                        nextedge[u] = fg->firstAt(u);
	                        if (excess[u] > 0) unbal->addLast(u);
	                }
	        }
	}
	delete unbal;
}

/** Add a vertex to the set of unbalanced vertices.
 *  This method is called from the balance method within the base class.
 *  @param u is a vertex that that is unbalanced; u may have been
 *  unbalanced previously as well
 */
void ppFifo::newUnbal(vertex u) {
	if (!unbal->member(u)) unbal->addLast(u);
}
