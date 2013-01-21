/** @file maxFloMin.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 *
 *  usage: maxFloMin
 * 
 *  MaxFloMin reads a Flograph from stdin, followed by a list of minimum
 *  flow requirements. It then computes a max flow for the graph,
 *  respecting the specified minimum flow constraints,
 *  then prints the flograph, showing the resulting max flow.
 *
 *  The min flow requirements must be separated by white space.
 *  There must be a min flow requirement for every edge (they may be 0)
 *  and they must appear in the same order as the edges in the flow graph.
 * 
 *  If there is no feasible flow, it simply prints a message to that effect.
 */

#include "Flograph.h"

using namespace grafalgo;

extern void minFlow(Flograph&, flow*, flow&);

int main() {
	Flograph fg; cin >> fg;
	flow minFlo[fg.m()+1];

	for (edge e = 1; e <= fg.m(); e++) cin >> minFlo[e];

	int floVal;
	minFlow(fg,minFlo,floVal);

	if (floVal >= 0) {
		cout << fg << "total flow of " << floVal << endl;
	} else {
		cout << "no feasible flow" << endl;
	}
}
