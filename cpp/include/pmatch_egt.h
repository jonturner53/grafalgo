/** @file pmatch_egt.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef PMATCH_EGT_H
#define PMATCH_EGT_H

#include "match_eg.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement algorithm for
 *  the priority matching problem, based on Turner's extension of
 *  the Edmonds-Gabow algorithm for ordinary matching.
 */
class pmatch_egt : public match_egc {
public: pmatch_egt(const Graph&, int*, edge*);
private:
	int*  prio;		// prio[u] is priority of vertex u

	void augment(edge);
	edge findpath(int);
};

} // ends namespace

#endif
