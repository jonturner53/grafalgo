/** @file ffMaxCap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// AugPathMaxcap class. Encapsulates data and routines used by the
// maximum capacity augmenting path algorithm. Use constructor to
// invoke the algorithm.

#ifndef FFMAXCAP_H
#define FFMAXCAP_H

#include "fordFulkerson.h"

namespace grafalgo {

/** This class encapsulates data and methods for the maximum capacity
 *  variant of the fordFulkerson path algorithm.
 *
 *  Use the constructor to invoke the algorithm.
 */
class ffMaxCap : public fordFulkerson {
public: 
	ffMaxCap(Flograph&);
private:
	bool	findPath();
};

} // ends namespace

#endif
