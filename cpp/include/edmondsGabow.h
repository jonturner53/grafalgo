/** @file edmondsGabow.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EDMONDSGABOW_H
#define EDMONDSGABOW_H

#include "edmondsGabowCore.h"

namespace grafalgo {

/** Encapsulates data and methods used to implement Gabow's version
 *  of Edmond's algorithm for finding a maximum size matching in a graph.
 */
class edmondsGabow : public edmondsGabowCore {
public: edmondsGabow(Graph&, Glist<edge>&);
private:
	edge findpath();
};

} // ends namespace

#endif
