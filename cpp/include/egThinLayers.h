/** @file egThinLayers.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGTHINLAYERS_H
#define EGTHINLAYERS_H

#include "GroupGraph.h"
#include "egColor.h"

namespace grafalgo {

/** This class implements the thin layers variant of the layering method for
 *  edge group coloring in a bipartite graph. This version selects edge
 *  groups that seek to minimize layer thickness.
 *
 *  The algorithm is invoked using its constructor.
 */
class egThinLayers : public egColor {
public:
	egThinLayers(GroupGraph&, int*);
};

} // ends namespace

#endif
