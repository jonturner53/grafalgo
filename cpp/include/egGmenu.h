/** @file egGmenu.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGGMENU_H
#define EGGMENU_H

#include "Dheap.h"
#include "Graph.h"
#include "Hash.h"
#include "HashMap.h"
#include "GroupGraph.h"
#include "egMenu.h"
#include "dynamicMatch.h"

namespace grafalgo {

/** This class implements the random version of the menu method for
 *  edge group coloring in a bipartite graph. This algorithm assigns
 *  colors randomly to edge group menus and uses binary search to
 *  find the smallest number of colors for which the random assignment
 *  succeeds.
 *
 *  The algorithm is invoked using its constructor.
 */
class egGmenu : public egMenu {
public:
	egGmenu(GroupGraph&, int*);
	~egGmenu();
};

} // ends namespace

#endif
