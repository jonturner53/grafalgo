/** @file match_eg.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MATCH_EG_H
#define MATCH_EG_H

#include "match_egc.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement Gabow's version
 *  of Edmond's algorithm for finding a maximum size matching in a graph.
 */
class match_eg : public match_egc {
public: match_eg(const Graph&, edge*);
private:
	edge findpath();
};

} // ends namespace

#endif
