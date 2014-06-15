// usage: cgraph type
//
// Copy a graph of specified type from stdin to stdout.
// Why you ask? To test input and output operators, of course.
// We also do an assignment in between input and output,
// in order to test the assignment operator.
//
// The allowed values of type are graph, wgraph,
// digraph, wdigraph, flograph, wflograph.

#include "stdinc.h"
#include "Adt.h"
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"

using namespace grafalgo;

int main(int argc, char *argv[]) { 

	if (argc != 2) Util::fatal("usage: cgraph type");

	if (strcmp(argv[1],"graph") == 0) {
		Graph g; cin >>g; Graph g1;
		g1.copyFrom(g); cout << g1;
	} else if (strcmp(argv[1],"wgraph") == 0) {
		Wgraph wg; cin >> wg; Wgraph wg1;
		wg1.copyFrom(wg); cout << wg1;
	} else if (strcmp(argv[1],"digraph") == 0) {
		Digraph dig; cin >> dig; Digraph dig1;
		dig1.copyFrom(dig); cout << dig1;
	} else if (strcmp(argv[1],"wdigraph") == 0) {
		Wdigraph wdig; cin >> wdig; Wdigraph wdig1;
		wdig1.copyFrom(wdig); cout << wdig1;
	} else if (strcmp(argv[1],"flograph") == 0) {
		Flograph fg; cin >> fg; Flograph fg1;
		fg1.copyFrom(fg); cout << fg1.toString();
	} else if (strcmp(argv[1],"wflograph") == 0) {
		Wflograph wfg; cin >> wfg; Wflograph wfg1;
		wfg1.copyFrom(wfg); cout << wfg1;
	} else {
		Util::fatal("usage: cgraph type");
	}
}
