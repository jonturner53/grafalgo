/** \file mflo_pphl.h
 *
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// mflo_pphl class. Encapsulates data and routines used by the fifo
// variant of the preflow-push method. This version uses incremental
// updating of distance labels.

#ifndef MFLO_PPHL_H
#define MFLO_PPHL_H

#include "mflo_pp.h"

namespace grafalgo {

/** PpHiLab class encapsulates data and methods used by the 
 *  highest label-first variant of the preflow-push method for
 *  finding maximum flows.
 */
class mflo_pphl : public mflo_pp {
public: 
		mflo_pphl(Graph_f&, bool);
		mflo_pphl(Graph_f&, bool, string&);
protected:
	int	*ubVec;		// ubVec[i] is an unbalanced vertex
				// with label i
	int	top;		// highest index into ubVec with ubVec[i]!=0
	Dlists *unbal;	// collection of circular lists of vertices

	void	addUnbal(vertex);
	vertex	removeUnbal();

	void	doit(bool);
};

} // ends namespace

#endif
