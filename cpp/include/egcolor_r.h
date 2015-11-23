/** @file egcolor_r.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_R_H
#define EGCOLOR_R_H

#include "Graph_g.h"
#include "egcolor_l.h"

namespace grafalgo {

/** This class implements the recoloring ariant of the layers method for
 *  edge group coloring in a bipartite graph. This version attempts to
 *  avoid allocation of new colors by recoloring edges along an augmenting
 *  path.
 *
 *  The algorithm is invoked using its constructor.
 */
class egcolor_r : public egcolor_l {
public:
	egcolor_r(Graph_g&, int*);
private:
	void	recolorGroup(int);
	void	recolor(int);
	bool	foundPath(edge, int, int);
};

} // ends namespace

#endif
