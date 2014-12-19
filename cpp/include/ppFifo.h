/** \file ppFifo.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// ppFifo class. Encapsulates data and routines used by the fifo
// variant of the preflow-push method. This version uses incremental
// updating of distance labels.

#ifndef PPFIFO_H
#define PPFIFO_H

#include "prePush.h"

/** PrePush class encapsulates data and methods used by the FIFO variant
 *  of the preflow-push method for computing maximum flows.
 */
class ppFifo : public prePush {
public: 
		ppFifo(Flograph&, bool);
protected:
	void	doit(bool);
	List	*unbal;	
	void    virtual addUnbal(vertex);
        vertex  virtual removeUnbal();
};

#endif
