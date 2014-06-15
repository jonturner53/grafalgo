/** @file genHardFlograph.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 *
 *  usage: genHardFlograph k1 k2
 * 
 *  GenHardFlograph generates a flow graph that requires a long time
 *  to complete, using most max flow algorithms.
 *  k1 and k2 are parameters that control the size of the
 *  instance. The graphs have approximately 24*k1 + 2*k2
 *  vertices and 18*k1 + k2^2 edges. Keep k1=k2 to get
 *  dense graphs. Use k2<k1 to get more sparse graphs.
 */
#include "Adt.h"
#include "Util.h"
#include "Flograph.h"

using namespace grafalgo;

extern void hardFlograph(int, int, Flograph&);

int main(int argc, char* argv[]) {
	int k1=0, k2=0;

	if (argc != 3 || (sscanf(argv[1],"%d",&k1)) != 1 ||
			 (sscanf(argv[2],"%d",&k2)) != 1)
		Util::fatal("usage genHardFlograph k1 k2");

	Flograph fg(10,20);
	hardFlograph(k1,k2,fg);

	string s;
	cout << fg;
}
