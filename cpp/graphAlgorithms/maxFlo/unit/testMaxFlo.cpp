/** @file testMaxFlo.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */


#include "stdinc.h"
#include "Flograph.h"
#include "Mflograph.h"
#include "maxCap.h"
#include "capScale.h"
#include "shortPath.h"
#include "dinic.h"
#include "dinicDtrees.h"
#include "prePush.h"
#include "ppFifo.h"
#include "ppHiLab.h"

using namespace grafalgo;

extern bool maxFloMin(Mflograph&, string);

/** usage: testMaxFlo method
 * 
 *  TestMaxFlo reads a flograph from stdin, computes a maximum flow
 *  using the method specified by the argument and then prints the
 *  flograph with the max flow.
 *
 *  The method can be one of shortPath, maxCap, capScale, dinic,
 *  dinicDtrees, ppFifo, ppFifoBatch, ppHiLab or ppHiLabBatch.
 */ 
int main(int argc, char *argv[]) {
	if (argc != 2) Util::fatal("usage: maxFlo method");

	if (strcmp(argv[1],"maxCap") == 0) {
		Flograph fg; cin >> fg;
		(maxCap(fg)); // parens added to resolve ambiguity
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"capScale") == 0) {
		Flograph fg; cin >> fg;
		(capScale(fg));
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"shortPath") == 0) {
		Flograph fg; cin >> fg;
		(shortPath(fg));
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"dinic") == 0) {
		Flograph fg; cin >> fg;
		(dinic(fg));
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"dinicDtrees") == 0) {
		Flograph fg; cin >> fg;
		(dinicDtrees(fg));
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"ppFifo") == 0) {
		Flograph fg; cin >> fg;
		ppFifo(fg,false);
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"ppFifoBatch") == 0) {
		Flograph fg; cin >> fg;
		ppFifo(fg,true);
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"ppHiLab") == 0) {
		Flograph fg; cin >> fg;
		ppHiLab(fg,false);
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"ppHiLabBatch") == 0) {
		Flograph fg; cin >> fg;
		ppHiLab(fg,true);
		cout << fg << "\ntotal flow of " << fg.totalFlow() << endl;
	} else if (strcmp(argv[1],"maxFloMin") == 0) {
		Mflograph mfg; cin >> mfg;
		if (maxFloMin(mfg,string("ppFifo")))
			cout << mfg << "\ntotal flow of " << mfg.totalFlow() << endl;
		else
			cout << "could not satisfy min flow constraints\n";
	} else if (strcmp(argv[1],"maxFloMinDinic") == 0) {
		Mflograph mfg; cin >> mfg;
		if (maxFloMin(mfg,string("dinic")))
			cout << mfg << "\ntotal flow of " << mfg.totalFlow() << endl;
		else
			cout << "could not satisfy min flow constraints\n";
	} else {
		Util::fatal("maxFlo: undefined method");
	}

	exit(0);
}
