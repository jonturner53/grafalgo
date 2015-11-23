/** \file mflo_ppf.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// mflo_ppf class. Encapsulates data and routines used by the fifo
// variant of the preflow-push method. This version uses incremental
// updating of distance labels.

#ifndef MFLO_PPF_H
#define MFLO_PPF_H

#include "mflo_pp.h"

namespace grafalgo {

/** PrePush class encapsulates data and methods used by the FIFO variant
 *  of the preflow-push method for computing maximum flows.
 */
class mflo_ppf : public mflo_pp {
public: 
		mflo_ppf(Graph_f&, bool);
protected:
	void	doit(bool);
	List	*unbal;	
	void    virtual addUnbal(vertex);
        vertex  virtual removeUnbal();
};

} // ends namespace

#endif
