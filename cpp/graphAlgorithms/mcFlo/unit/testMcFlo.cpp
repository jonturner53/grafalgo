/** @file testMcFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Wflograph.h"
#include "mcfCycRed.h"
#include "mcfLcap.h"
#include "mcfScale.h"

using namespace grafalgo;

/** usage: testMcFlo method
 * 
 *  TestMcFlo reads a Wflograph from stdin, computes a min cost maximum flow
 *  using the method specified by the argument and then prints the
 *  Wflograph with the computed flow.
 *
 *  Method is one of cycRed, lcap, mostNeg, scale
 */
int main(int argc, char *argv[]) {
	flow floVal = 0; cost floCost = 0;
	Wflograph wfg; cin >> wfg;
	
	if (argc != 2) Util::fatal("usage: mcFlo method");

	if (strcmp(argv[1],"cycRed") == 0)
		mcfCycRed(wfg,floVal,floCost);
	else if (strcmp(argv[1],"lcap") == 0)
		mcfLcap(wfg,floVal,floCost,false);
	else if (strcmp(argv[1],"mostNeg") == 0)
		mcfLcap(wfg,floVal,floCost,true);
	else if (strcmp(argv[1],"scale") == 0)
		mcfScale(wfg,floVal,floCost);
	else
		Util::fatal("mcFlo: undefined method");

	cout << wfg << "flow value is " << floVal
	     << " and flow cost is " << floCost << endl;
}
