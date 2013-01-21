/** @file shortPath.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
// AugPathShort class. Encapsulates data and routines used by the
// shortest augmenting path algorithm.
// Use constructor to invoke algorithm.

#ifndef SHORTPATH_H
#define SHORTPATH_H

#include "augPath.h"
#include "Util.h"

/** This class encapsulates data and methods for the shortest path
 *  variant of the augmenting path algorithm for max flow.
 * 
 *  Use the constructor to invoke the algorithm.
 */
class shortPath : public augPath {
public: 
	shortPath(Flograph&,int&);
private:
        bool	findPath();
};

#endif
