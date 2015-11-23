/** @file mflo_ffsp.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MFLO_FFSP_H
#define MFLO_FFSP_H

#include "mflo_ff.h"
#include "Util.h"

namespace grafalgo {

/** This class encapsulates data and methods for the shortest path
 *  variant of the Ford-Fulkerson algorithm for max flow.
 * 
 *  Use the constructor to invoke the algorithm.
 */
class mflo_ffsp : public mflo_ff {
public: 
	mflo_ffsp(Graph_f&);
private:
        bool	findPath();
};

} // ends namespace

#endif
