/** \file prePush.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

// prePush class. Encapsulates data and routines used by the preflow-push
// algorithms for max flow. Users invoke the algorithm using the constructor
// with optional arguments to select different variants.

#ifndef PREPUSHC_H
#define PREPUSHC_H

#include "stdinc.h"
#include "Flograph.h"
#include "List.h"

using namespace grafalgo;

/** PrePush class ecapsulates data and methods used by the preflow-push
 *  algorithms for maximum flow. Subclasses are defined for each
 *  specific algorithm. The base class defines elements common to
 *  all the subclasses.
 */
class prePush {
public: 
		prePush(Flograph&);
		~prePush();
protected:
        Flograph* fg;           ///< graph we're finding flow on
	int 	*d;		///< vector of distance labels
	int 	*excess; 	///< excess flow entering vertex
	edge 	*nextedge;	///< pointer into adjacency list

	void	maxFlowIncr();
	void	maxFlowBatch();

        void   	initdist(); 
	int	flowValue();	
        int    	minlabel(vertex);
	void	virtual addUnbal(vertex); 
	vertex	virtual removeUnbal(); 
	bool 	balance(vertex);
};

#endif
