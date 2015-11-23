/** @file egcolor_gm.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_GM_H
#define EGCOLOR_GM_H

#include "Heap_d.h"
#include "Graph.h"
#include "Hash.h"
#include "Map_h.h"
#include "Graph_g.h"
#include "egcolor_menu.h"
#include "dmatch.h"

namespace grafalgo {

/** This class implements the random version of the menu method for
 *  edge group coloring in a bipartite graph. This algorithm assigns
 *  colors randomly to edge group menus and uses binary search to
 *  find the smallest number of colors for which the random assignment
 *  succeeds.
 *
 *  The algorithm is invoked using its constructor.
 */
class egcolor_gm : public egcolor_menu {
public:
	egcolor_gm(Graph_g&, int*);
	~egcolor_gm();
};

} // ends namespace

#endif
