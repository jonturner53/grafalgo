// AugPathShort class. Encapsulates data and routines used by the
// shortest augmenting path algorithm.
// Use constructor to invoke algorithm.

#ifndef SHORTPATH_H
#define SHORTPATH_H

#include "augPath.h"
#include "Util.h"

class shortPath : public augPath {
public: 
	shortPath(Flograph&,int&);
private:
        bool	findPath();

	int	pathCount;
	int	basicStepCount;
};

#endif
