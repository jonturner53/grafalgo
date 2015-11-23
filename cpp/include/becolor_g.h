/** @file becolor_g.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BECOLOR_G_H
#define BECOLOR_G_H

#include "becolor.h"

namespace grafalgo {

/** Greedy algorithm for bounded edge coloring problem.
 *  Invoked using constructor.
 */
class becolor_g : public becolor { public: becolor_g(const Graph_wd&, int*); };

} // ends namespace

#endif
