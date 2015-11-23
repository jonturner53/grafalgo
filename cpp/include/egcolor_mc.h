/** @file egcolor_mc.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_MC_H
#define EGCOLOR_MC_H

#include "Graph_g.h"
#include "egcolor_l.h"

namespace grafalgo {

/** This class implements the MinColor variant of the layers method for
 *  edge group coloring in a bipartite graph. This allows different layers
 *  to use overlapping sets of colors.
 *  The algorithm is invoked using its constructor.
 */
class egcolor_mc : public egcolor_l {
public:
	egcolor_mc(Graph_g&, int*);
};

} // ends namespace

#endif
