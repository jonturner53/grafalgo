/** @file egcolor_tl.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_TL_H
#define EGCOLOR_TL_H

#include "Graph_g.h"
#include "egcolor_l.h"

namespace grafalgo {

/** This class implements the thin layers variant of the layering method for
 *  edge group coloring in a bipartite graph. This version selects edge
 *  groups that seek to minimize layer thickness.
 *
 *  The algorithm is invoked using its constructor.
 */
class egcolor_tl : public egcolor_l {
public:
	egcolor_tl(Graph_g&, int*);
};

} // ends namespace

#endif
