/** @file egRmenu.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGRMENU_H
#define EGRMENU_H

#include "GroupGraph.h"
#include "egMenu.h"

namespace grafalgo {

/** This class implements the "few colors" method for
 *  edge group coloring in a bipartite graph. This method
 *  colors edge groups in decreasing order of size, coloring
 *  each group with a limited number of colors, using greedy
 *  set covering.
 *
 *  The algorithm is invoked using its constructor.
 */
class egRmenu : public egMenu {
public:
	egRmenu(GroupGraph&, int*);

	bool	colorAll(int);
	void	allocate(int);
};

} // ends namespace

#endif
