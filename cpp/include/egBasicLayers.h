/** @file egBasicLayers.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGBASICLAYERS_H
#define EGBASICLAYERS_H

#include "GroupGraph.h"
#include "egLayers.h"

namespace grafalgo {

/** This class implements the basic version of the layers method for
 *  edge group coloring in a bipartite graph.
 *  The algorithm is invoked using its constructor.
 */
class egBasicLayers : public egLayers {
public:
	egBasicLayers(GroupGraph&, int*);
};

} // ends namespace

#endif
