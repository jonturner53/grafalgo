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
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"

main(int argc, char *argv[]) { 

	if (argc != 2) fatal("usage: cgraph type");

	string s;
	if (strcmp(argv[1],"graph") == 0) {
		Graph g; g.read(cin); Graph g1(1,1);
		g1.copyFrom(g); cout << g1.toString(s);
	} else if (strcmp(argv[1],"wgraph") == 0) {
		Wgraph wg; wg.read(cin); Wgraph wg1(1,1);
		wg1.copyFrom(wg); cout << wg1.toString(s);
	} else if (strcmp(argv[1],"digraph") == 0) {
		Digraph dig; dig.read(cin); Digraph dig1(1,1);
		dig1.copyFrom(dig); cout << dig1.toString(s);
	} else if (strcmp(argv[1],"wdigraph") == 0) {
		Wdigraph wdig; wdig.read(cin); Wdigraph wdig1(1,1);
		wdig1.copyFrom(wdig); cout << wdig1.toString(s);
	} else if (strcmp(argv[1],"flograph") == 0) {
		Flograph fg; fg.read(cin); Flograph fg1(2,1);
		fg1.copyFrom(fg); cout << fg1.toString(s);
	} else if (strcmp(argv[1],"wflograph") == 0) {
		Wflograph wfg; wfg.read(cin); Wflograph wfg1(2,1);
		wfg1.copyFrom(wfg); cout << wfg1.toString(s);
	} else {
		fatal("usage: cgraph type");
	}
}
