// usage:
//	maxFloRep method reps n m mss ec1 ec2 
//
// MaxFloRep repeatedly generates a random graph and computes
// a maximum flow using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, p is the edge probability,
// mss is the number of source and sink edges
// ec1 is the mean edge capacity for the source/sink edges,
// ec2 is the mean edge capacity of the other edges.
//

#include "stdinc.h"
#include "Flograph.h"
#include "maxCap.h"
#include "capScale.h"
#include "shortPath.h"
#include "dinic.h"
#include "dinicDtrees.h"
#include "prePush.h"
#include "ppFifo.h"

int main(int argc, char* argv[]) {
	int i, reps, n, m, mss, ec1, ec2, floVal;
	if (argc != 8 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ec1) != 1 ||
	    sscanf(argv[7],"%d",&ec2) != 1)
		Util::fatal("usage: maxFloRep method reps n m mss ec1 ec2");

	Flograph fg(n,m,1,2); 
	for (i = 1; i <= reps; i++) {
		fg.rgraph(n,m,mss); fg.randCapacity(ec1,ec2);

		if (strcmp(argv[1],"maxCap") == 0)
			maxCap(fg,floVal);
		else if (strcmp(argv[1],"capScale") == 0)
			capScale(fg,floVal);
		else if (strcmp(argv[1],"shortPath") == 0)
			shortPath(fg,floVal);
		else if (strcmp(argv[1],"dinic") == 0)
			dinic(fg,floVal);
		else if (strcmp(argv[1],"dinicDtrees") == 0)
			dinicDtrees(fg,floVal);
		else if (strcmp(argv[1],"ppFifo") == 0)
			ppFifo(fg,floVal,false);
		else if (strcmp(argv[1],"ppFifoBatch") == 0)
			ppFifo(fg,floVal,true);
		else
			Util::fatal("maxFloRep: undefined method");
	}
}
