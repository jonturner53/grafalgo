/** @file layers1.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef LAYERS1_H
#define LAYERS1_H

#include "GroupGraph.h"
#include "egColor.h"

namespace grafalgo {

/** This class implements the a variant of the layers method for
 *  edge group coloring in a bipartite graph.
 *  The algorithm is invoked using its constructor.
 */
class layers1 : public egColor {
public:
	layers1(GroupGraph&, int*);
};

} // ends namespace

#endif
