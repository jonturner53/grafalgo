/** @file egcolor_fc.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_FC_H
#define EGCOLOR_FC_H

#include "Graph_g.h"
#include "egcolor.h"

namespace grafalgo {

/** This class implements the "few colors" method for
 *  edge group coloring in a bipartite graph. This method
 *  colors edge groups in decreasing order of size, coloring
 *  each group with a limited number of colors, using greedy
 *  set covering.
 *
 *  The algorithm is invoked using its constructor.
 */
class egcolor_fc : public egcolor {
public:
	egcolor_fc(Graph_g&, int*);
private:
	void	fewColorGroup(int);
};

} // ends namespace

#endif
