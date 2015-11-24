// Header file for class that implements Edmond's algorithm for
// finding a maximum size matching in a general graph. To use,
// invoke the constructor.

#ifndef MATCH_EGF_H
#define MATCH_EGF_H

#include "match_egc.h"

namespace grafalgo {

class match_egf : public match_egc {
public: match_egf(Graph&, List_g<edge>&);
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
