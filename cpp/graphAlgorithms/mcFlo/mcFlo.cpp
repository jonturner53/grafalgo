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

using namespace grafalgo;

int main(int argc, char *argv[]) {
	flow floVal = 0; cost floCost = 0;
	Wflograph wfg; cin >> wfg;
	
	if (argc != 2) Util::fatal("usage: mcFlo method");

	if (strcmp(argv[1],"cycRed") == 0)
		cycRed(wfg,floVal,floCost);
	else if (strcmp(argv[1],"lcap") == 0)
		lcap(wfg,floVal,floCost,false);
	else if (strcmp(argv[1],"mostNeg") == 0)
		lcap(wfg,floVal,floCost,true);
	else
		Util::fatal("mcFlo: undefined method");

	string s;
	cout << wfg;
	cout << "flow value is " << floVal
	     << " and flow cost is " << floCost << endl;
}
