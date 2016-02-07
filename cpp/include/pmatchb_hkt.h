/** @file pmatchb_hkt.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef PMATCHB_HKT_H
#define PMATCHB_HKT_H

#include "Graph.h"
#include "Graph_f.h"
#include "mflo_d.h"
#include "List_g.h"
#include "ListPair.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement algorithm for
 *  the priority matching problem, based on Turner's extension of
 *  the Hopcroft-Karp algorithm for ordinary matching.
 */
class pmatchb_hkt {
public: pmatchb_hkt(Graph&, int*, edge*);
private:
	void augment(edge);
	edge findpath(int);
};

} // ends namespace

#endif
