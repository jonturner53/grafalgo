/** @file egcolor_bl.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_BL_H
#define EGCOLOR_BL_H

#include "Graph_g.h"
#include "egcolor_l.h"

namespace grafalgo {

/** This class implements the basic version of the layers method for
 *  edge group coloring in a bipartite graph.
 *  The algorithm is invoked using its constructor.
 */
class egcolor_bl : public egcolor_l {
public:
	egcolor_bl(Graph_g&, int*);
};

} // ends namespace

#endif
