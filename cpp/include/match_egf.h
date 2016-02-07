/** @file Match_egf.h
 *
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MATCH_EGF_H
#define MATCH_EGF_H

#include "match_egc.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement a fast version
 *  of Gabow's implementation of Edmonds' algorithm. To invoke,
 *  use constructor.
 */
class match_egf : public match_egc {
public: match_egf(const Graph&, edge*);
private:
	int  searchNum;		///< number of current path search
	int* latestSearch;	///< latestSearch[u] == searchNum <=>
				///< u is reached
	edge* nextEdge;		///< nextEdge[u] is next edge to search at u
	List* pending;		///< list of vertices used by findpath
	List_d* unmatched;	///< list of unmatched vertices

	edge findpath();	// find an augmenting path
};

} // ends namespace

#endif
