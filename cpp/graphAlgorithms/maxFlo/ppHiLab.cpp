/** \file ppHiLab.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "ppHiLab.h"

/** Find maximum flow in a flow graph using the highest-label-first
 *  variant of the preflow-push algorithm.
 *  @param fg1 is a reference to the flow graph
 *  @param floVal is a reference to an integer variable in which the
 *  maximum flow value is returned
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 */
ppHiLab::ppHiLab(Flograph& fg1, int& floVal, bool batch) : prePush(fg1,floVal) {
	doit(batch); floVal = flowValue();
}

/** Find maximum flow in a flow graph using the highest-label-first
 *  variant of the preflow-push algorithm.
 *  @param fg1 is a reference to the flow graph
 *  @param floVal is a reference to an integer variable in which the
 *  maximum flow value is returned
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 *  @param stats is a reference to a string in which the statistics
 *  information is returned
 */

ppHiLab::ppHiLab(Flograph& fg1, int& floVal, bool batch, string& stats)
		: prePush(fg1,floVal) {
	doit(batch); floVal = flowValue();
	stringstream ss;
	ss << satCount << " " << nonSatCount << " " << newDistCount
	   << " " << relabCount;
	stats = ss.str();
}

/** Helper method that implements the core algorithm common to the two
 *  constructors.
 *  @param batch is a boolean which determines if the algorithm uses
 *  batch relabeling (batch=true) or incremental relabeling (batch=false)
 */
void ppHiLab::doit(bool batch) {
	// ubVec[d] is an unbalanced vertex with a distance label of d
	// or 0 if there is no unbalanced vertex with a distance label of d
	// unbal partitions the vertices into circular lists, where all
	// vertices on the same list are unbalanced and have the same
	// distance label; balanced vertices each form singleton lists
	ubVec = new int[2*fg->n()];
	unbal = new ClistSet(fg->n());

	// initialization
	for (int i = 0; i < 2*fg->n(); i++) ubVec[i] = 0;
	top = 0;
	vertex s = fg->src();
        for (edge e = fg->firstOut(s); e != 0; e = fg->nextOut(s,e)) {
                vertex v = fg->head(e);
                if (v != fg->snk()) addUnbal(v);
        }

	vertex u;
	if (!batch) { // incremental relabeling
     		while (top > 0) {
			u = removeUnbal();
			if (!balance(u)) {
				d[u] = 1 + minlabel(u);
				nextedge[u] = fg->firstAt(u);
				addUnbal(u);
				relabCount++;
			}
		}
	} else { // batch relabeling
	     	while (top > 0) {
	     		while (top > 0) {
				u = removeUnbal();
				balance(u);
			}
	                initdist();
	                for (u = 1; u <= fg->n(); u++) {
				if (u == fg->src() || u == fg->snk()) continue;
	                        nextedge[u] = fg->firstAt(u);
	                        if (excess[u] > 0) addUnbal(u);
	                }
	        }
	}
	delete unbal; delete [] ubVec;
}

/** Add a vertex to the vector of lists of unbalanced vertices,
 *  if it is not already there.
 */
void ppHiLab::newUnbal(vertex u) {
	if (unbal->suc(u) == u && ubVec[d[u]] != u) addUnbal(u);
}

/** Add an unbalanced vertex to the vector of lists of such vertices.
 *  @param u is the unbalanced vertex to be added to the list of
 *  of unbalanced vertices with the same distance label as u
 */
void ppHiLab::addUnbal(vertex u) {
	if (ubVec[d[u]] == 0) ubVec[d[u]] = u;
	else unbal->join(ubVec[d[u]],u);
	top = max(top,d[u]);
}

/** Remove and return an unbalanced vertex with the largest distance label.
 *  @return an unbalanced vertex u that has a maximum distance label;
 *  u is also removed from the data structure that tracks unbalanced
 *  vertices, so if it remains unbalanced after being processed,
 *  it must be added back
 */
vertex ppHiLab::removeUnbal() {
	vertex u = ubVec[top]; 
	vertex v = unbal->suc(u);
	unbal->remove(u);
	if (v != u) {
		ubVec[top] = v;
	} else {
		ubVec[top] = 0;
		while (top > 0 && ubVec[top] == 0) top--;
	}
	return u;
}

