/** @file mflo_ffmc.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// AugPathMaxcap class. Encapsulates data and routines used by the
// maximum capacity augmenting path algorithm. Use constructor to
// invoke the algorithm.

#ifndef MFLO_FFMC_H
#define MFLO_FFMC_H

#include "mflo_ff.h"

namespace grafalgo {

/** This class encapsulates data and methods for the maximum capacity
 *  variant of the mflo_ff path algorithm.
 *
 *  Use the constructor to invoke the algorithm.
 */
class mflo_ffmc : public mflo_ff {
public: 
	mflo_ffmc(Graph_f&);
private:
	bool	findPath();
};

} // ends namespace

#endif
