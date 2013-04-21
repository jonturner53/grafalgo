// usage:
//	mcFloRep method reps n m mss ec1 ec2 lo hi 
//
// mcFloRep repeated generates a random graph and computes
// a min cost max flow using the specified method.
// Reps is the number of repetitions.
// n is the number of vertices, m is the total number of edges,
// mss is the number of edges from the source and the number
// to the sink, ec1 is the average capacity for the src/sink
// edges, ec2 is the average capacity for the other edges,
// lo and hi define the range for the edge costs
//

#include "stdinc.h"
#include "Wflograph.h"
#include "Rgraph.h"
#include "cycRed.h"
#include "lcap.h"

using namespace grafalgo;

int main(int argc, char* argv[]) {
	int i, reps, n, m, mss, ec1, ec2, lo, hi;
	if (argc != 10 ||
	    sscanf(argv[2],"%d",&reps) != 1 ||
	    sscanf(argv[3],"%d",&n) != 1 ||
	    sscanf(argv[4],"%d",&m) != 1 ||
	    sscanf(argv[5],"%d",&mss) != 1 ||
	    sscanf(argv[6],"%d",&ec1) != 1 ||
	    sscanf(argv[7],"%d",&ec2) != 1 ||
	    sscanf(argv[8],"%d",&lo) != 1 ||
	    sscanf(argv[9],"%d",&hi) != 1)
		Util::fatal("usage: mcFloRep method reps n m mss ec1 ec2 lo hi");

	Wflograph wfg; flow floVal; cost floCost;
	for (i = 1; i <= reps; i++) {
		Rgraph::flograph(wfg,n,m-2*mss,mss);
		Rgraph::edgeCapacity(wfg,ec1,ec2);
		Rgraph::edgeCost(wfg,lo,hi);

		if (strcmp(argv[1],"cycRed") == 0)
			cycRed(wfg,floVal,floCost);
		else if (strcmp(argv[1],"lcap") == 0)
			lcap(wfg,floVal,floCost,false);
		else if (strcmp(argv[1],"mostNeg") == 0)
			lcap(wfg,floVal,floCost,true);
		else
			Util::fatal("mcFloRep: undefined method");
	}
}
