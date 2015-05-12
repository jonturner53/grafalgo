/** @file egMinColor.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGMINCOLOR_H
#define EGMINCOLOR_H

#include "GroupGraph.h"
#include "egColor.h"

namespace grafalgo {

/** This class implements the MinColor variant of the layers method for
 *  edge group coloring in a bipartite graph. This allows different layers
 *  to use overlapping sets of colors.
 *  The algorithm is invoked using its constructor.
 */
class egMinColor : public egColor {
public:
	egMinColor(GroupGraph&, int*);
};

} // ends namespace

#endif
