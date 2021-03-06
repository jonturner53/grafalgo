// AugPathScale class. Encapsulates data and routines used by the
// capacity scaling variant of the augmenting path method.
// Use the constructor to invoke the algorithm.

#ifndef CAPSCALE_H
#define CAPSCALE_H

#include "augPath.h"

class capScale : public augPath {
public: 
	capScale(Flograph&,int&);
private:
	flow	scale;		// scale factor for scaling method
        bool	findPath();
};

#endif
