// usage: maxFloMin method
//
// MaxFloMin reads a Mflograph from stdin, computes a maximum flow
// for the graph, respecting the specified minimum flow constraints,
// then prints the Mflograph, showing the resulting max flow.
//
// If there is no feasilbe flow, it simply prints a message to that effect.`
//

#include "stdinc.h"
#include "Mflograph.h"
#include "minFlow.h"

int main(int argc, char *argv[]) {
	Mflograph fg; fg.read(cin);

	if (argc != 1) fatal("usage: maxFloMin method");

	int floVal;
	minFlow(fg,floVal);

	if (floVal >= 0) {
		string s;
		cout << fg.toString(s) << "total flow of " << floVal << endl;
	} else {
		cout << "no feasible flow" << endl;
	}
}
