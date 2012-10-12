// Header file for data structure that maintains a staircase function.
// Main operations include testing for the minimum value in a
// specified range and increasing (or decreasing) the value
// across all points in a specified range.
// x values are required to be non-negative.

#ifndef STEPS_H
#define STEPS_H

#include "DualKeyBsts.h"
#include "UiList.h"

class StaircaseFunc {
public: 	StaircaseFunc(int);
		~StaircaseFunc();
	static	const int MAXY = BIGINT-1;  // maximum allowed key2 value
	int	value(int); 		    // return y value for given x
	int	findmin(int,int); 	    // return min value in given range
	void	change(int,int,int);	    // change values in range by delta
	string&	toString(string&) const;
protected:
	int	n;			// max number of steps function may have
	DualKeyBsts *points;		// data structure for "change points"
	UiList	*free;			// list of unused items in points
};

#endif
