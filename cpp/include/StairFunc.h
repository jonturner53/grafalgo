// Header file for data structure that maintains a staircase function.
// Main operations include testing for the minimum value in a
// specified range and increasing (or decreasing) the value
// across all points in a specified range.
// x values are required to be non-negative.

#ifndef STAIRFUNC_H
#define STAIRFUNC_H

#include "DkBstSet.h"
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

	static	const int MAXY = Util::BIGINT32-1; // max allowed key2 value
	int	value(int); 		    // return y value for given x
	int	findmin(int,int); 	    // return min value in given range
	void	change(int,int,int);	    // change values in range by delta

	string&	toString(string&) const;
	string 	toString() const;
protected:
	DkBstSet *points;		// data structure for "change points"
	List	*free;			// list of unused items in points

	void	makeSpace(int);
	void	freeSpace();
};

} // ends namespace

#endif
