/** @file egRecolor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGRECOLOR_H
#define EGRECOLOR_H

#include "GroupGraph.h"
#include "egColor.h"

namespace grafalgo {

/** This class implements the recoloring ariant of the layers method for
 *  edge group coloring in a bipartite graph. This version attempts to
 *  avoid allocation of new colors by recoloring edges along an augmenting
 *  path.
 *
 *  The algorithm is invoked using its constructor.
 */
class egRecolor : public egColor {
public:
	egRecolor(GroupGraph&, int*);
};

} // ends namespace

#endif
