/** @file StairFunc.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef STAIRFUNC_H
#define STAIRFUNC_H

#include "DkSsets.h"
#include "List.h"

namespace grafalgo {

/** This class implements a "staircase function".
 *  It provides methods for efficiently finding the minimum function value
 *  within a specified range and modifying the function value in a range
 *  by some constant.
 *
 *  It is implemented using a dual key binary search tree, where the
 *  first key represents the x-coordinate of a "step" in the function and
 *  the y-coordinate represents the value from that point to the next point.
 */
class StairFunc : public Adt {
public: 	StairFunc(int);
		~StairFunc();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const StairFunc&);

	static	const int MAXY = Util::INT_MAX-1; // max allowed key2 value
	int	value(int); 		    // return y value for given x
	int	findmin(int,int); 	    // return min value in given range
	void	change(int,int,int);	    // change values in range by delta

	string&	toString(string&) const;
	string 	toString() const;
protected:
	DkSsets *points;		// data structure for "change points"
	List	*free;			// list of unused items in points

	void	makeSpace();
	void	freeSpace();
};

} // ends namespace

#endif
