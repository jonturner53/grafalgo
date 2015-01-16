/** @file ffScale.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// AugPathScale class. Encapsulates data and routines used by the
// capacity scaling variant of the fordFulkerson method.
// Use the constructor to invoke the algorithm.

#ifndef CAPSCALE_H
#define CAPSCALE_H

#include "fordFulkerson.h"

namespace grafalgo {

/** This class encapsulates data and methods used by the capacity scaling
 *  variant of the fordFulkerson algorithm.
 *
 *  Use the constructor to invoke the algorithm.
 */
class ffScale : public fordFulkerson {
public: 
	ffScale(Flograph&);
private:
	flow	scale;		///< scale factor for scaling method
        bool	findPath();
};

} // ends namespace

#endif
