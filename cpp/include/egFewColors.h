/** @file egFewColors.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGFEWCOLORS_H
#define EGFEWCOLORS_H

#include "GroupGraph.h"
#include "egColor.h"

namespace grafalgo {

/** This class implements the "few colors" method for
 *  edge group coloring in a bipartite graph. This method
 *  colors edge groups in decreasing order of size, coloring
 *  each group with a limited number of colors, using greedy
 *  set covering.
 *
 *  The algorithm is invoked using its constructor.
 */
class egFewColors : public egColor {
public:
	egFewColors(GroupGraph&, int, int*);
};

} // ends namespace

#endif
