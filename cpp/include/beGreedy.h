/** @file beGreedy.h
 * 
 *  @author Jon Turner
 *  @date 2015
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef BEGREEDY_H
#define BEGREEDY_H

#include "beColor.h"

namespace grafalgo {

/** Greedy algorithm for bounded edge coloring problem.
 *  Invoked using constructor.
 */
class beGreedy : public beColor { public: beGreedy(const Wdigraph&, int*); };

} // ends namespace

#endif
