/** \file ppHiLab.h
 *
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// ppHiLab class. Encapsulates data and routines used by the fifo
// variant of the preflow-push method. This version uses incremental
// updating of distance labels.

#ifndef PPHILAB_H
#define PPHILAB_H

#include "prePush.h"

/** PpHiLab class encapsulates data and methods used by the 
 *  highest label-first variant of the preflow-push method for
 *  finding maximum flows.
 */
class ppHiLab : public prePush {
public: 
		ppHiLab(Flograph&, int&, bool);
		ppHiLab(Flograph&, int&, bool, string&);
protected:
	int	*ubVec;		// ubVec[i] is an unbalanced vertex
				// with label i
	int	top;		// highest index into ubVec with ubVec[i]!=0
	UiClist *unbal;		// collection of circular lists of vertices

	void	newUnbal(vertex);
	void	addUnbal(vertex);
	vertex	removeUnbal();

	void	doit(bool);
};

#endif
