// usage: mcFlo method
//
// mcFlo reads a Wflograph from stdin, computes a min cost maximum flow
// using the method specified by the argument and then prints the
// Wflograph with the computed flow.
//

#include "stdinc.h"
#include "Wflograph.h"
#include "cycRed.h"
#include "lcap.h"

main(int argc, char *argv[]) {
	flow floVal; cost floCost;
	Wflograph wfg; wfg.read(cin);
	
	if (argc != 2) fatal("usage: mcFlo method");

	if (strcmp(argv[1],"cycRed") == 0)
		cycRed(wfg,floVal,floCost);
	else if (strcmp(argv[1],"lcap") == 0)
		lcap(wfg,floVal,floCost,false);
	else if (strcmp(argv[1],"mostNeg") == 0)
		lcap(wfg,floVal,floCost,true);
	else
		fatal("mcFlo: undefined method");

	string s;
	cout << wfg.toString(s);
	cout << "flow value is " << floVal
	     << " and flow cost is " << floCost << endl;
}
