/** @file beAugPath.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BEAUGPATH_H
#define BEAUGPATH_H

#include "beColor.h"

namespace grafalgo {

/** Augmenting path algorithm for bounded edge coloring problem.
 *  Invoked using constructor.
 */
class beAugPath : public beColor {
public:
	beAugPath(const Wdigraph&, int*);
private:
	edge **emap;		// emap[u][c] is edge using color c at u
	bool augPath(edge, vertex, int, int);
};

} // ends namespace

#endif
