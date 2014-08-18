/** usage: color method [ verify ]
 * 
 *  Match reads a bipartite graph from stdin, and computes an edge coloring
 *  using the method specified by the argument and then prints the
 *  resulting coloring.
 * 
 *  Methods currently implemented include match, fmatch and altPath
*/

#include "stdinc.h"
#include "Graph.h"

namespace grafalgo {
extern int ecMatch(Graph&, int[]);
extern int ecFmatch(Graph&, int[]);
extern int ecAltPath(Graph&, int[]);
extern int ecCheck(Graph&, int[]);
}

using namespace grafalgo;

int main(int argc, char *argv[]) {
	if (argc != 2 && argc != 3)
		Util::fatal("usage: color method [ verify ]");
	bool verify = (argc == 3 && strcmp(argv[2],"verify") == 0 ?
			true : false);

	Graph graf;
	cin >> graf;

	int *color = new int[graf.maxEdgeNum()+1];
	for (edge e = 0; e <= graf.maxEdgeNum(); e++) color[e] = 0;

	int numColors = 0;
	if (strcmp(argv[1],"match") == 0) {
		numColors = ecMatch(graf,color);
	} else if (strcmp(argv[1],"fmatch") == 0) {
		numColors = ecFmatch(graf,color);
	} else if (strcmp(argv[1],"altPath") == 0) {
		numColors = ecAltPath(graf,color);
	} else {
		Util::fatal("match: invalid method");
	}
	if (verify) ecCheck(graf,color);
	cout << numColors << " colors used" << endl;

	if (graf.n() > 100) exit(0); // print colorings for smaller graphs only
	for (int c = 1; c <= numColors; c++) {
		cout << c << ": ";
		for (edge e = graf.first(); e != 0; e = graf.next(e)) {
			if (color[e] == c) {
				cout << "(" << graf.index2string(graf.left(e));
				cout << "," << graf.index2string(graf.right(e));
				cout << ") ";
			}
		}
		cout << endl;
	}
	delete [] color;
}
