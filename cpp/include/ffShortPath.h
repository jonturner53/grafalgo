/** @file ffShortPath.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef FFSHORTPATH_H
#define FFSHORTPATH_H

#include "fordFulkerson.h"
#include "Util.h"

namespace grafalgo {

/** This class encapsulates data and methods for the shortest path
 *  variant of the Ford-Fulkerson algorithm for max flow.
 * 
 *  Use the constructor to invoke the algorithm.
 */
class ffShortPath : public fordFulkerson {
public: 
	ffShortPath(Flograph&);
private:
        bool	findPath();
};

} // ends namespace

#endif
