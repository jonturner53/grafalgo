/** @file becolor_ap.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BECOLOR_AP_H
#define BECOLOR_AP_H

#include "becolor.h"

namespace grafalgo {

/** Augmenting path algorithm for bounded edge coloring problem.
 *  Invoked using constructor.
 */
class becolor_ap : public becolor {
public:
	becolor_ap(const Graph_wd&, int*);
private:
	edge **emap;		// emap[u][c] is edge using color c at u
	bool augPath(edge, vertex, int, int);
};

} // ends namespace

#endif
