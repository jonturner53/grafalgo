/** usage: testBecolor method [ show verify ]
 * 
 *  TestBecolor reads a weighted graph from stdin, where the weights
 *  represent color bounds. It then computes a bounded edge coloring
 *  using the method specified by the argument. If the verify 
 *  argument is present (the string "verify"), the resulting coloring is
 *  checked for correctness, and a message is printed for each violation.
 * 
 *  Methods currently implemented include ...
*/

#include "stdinc.h"
#include "Wdigraph.h"
#include "beGreedy.h"
#include "beAugPath.h"

namespace grafalgo {
extern void beRepMatch(Wdigraph&, int[]);
extern void beMaxDegMatch(Wdigraph&, int[]);
extern void beStrictSplit(Wdigraph&, int[]);
extern int degBound(Wdigraph&);
extern int matchBound(Wdigraph&);
extern int flowBound(Wdigraph&);
}

using namespace grafalgo;

bool beCheck(Wdigraph&, int[], int);

int main(int argc, char *argv[]) {
	if (argc < 2)
		Util::fatal("usage: color method [ show verify ]");
	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}
		
	Wdigraph g; cin >> g;
	int color[g.M()+1];
	for (edge e = 1; e <= g.M(); e++) color[e] = 0;

	if (strcmp(argv[1],"repMatch") == 0) {
		beRepMatch(g,color);
	} else if (strcmp(argv[1],"maxDegMatch") == 0) {
		beMaxDegMatch(g,color);
	} else if (strcmp(argv[1],"greedy") == 0) {
		beGreedy(g,color);
	} else if (strcmp(argv[1],"strictSplit") == 0) {
		beStrictSplit(g,color);
	} else if (strcmp(argv[1],"augPath") == 0) {
		beAugPath(g,color);
	} else {
		Util::fatal("testBecolor: invalid method");
	}
	int cmax = 0;
	for (edge e = g.first(); e != 0; e = g.next(e)) {
		cmax = max(cmax, color[e]);
	}
	cout << cmax << " " << degBound(g) << " " << matchBound(g) << " "
	     << flowBound(g) << endl;

	if (verify) beCheck(g, color, cmax);
	if (!show) exit(0);
	for (vertex u = 1; u <= g.n(); u++) {
		if (g.firstOut(u) == 0) continue;
		cout << g.index2string(u) << ": ";
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			vertex v = g.right(e);
			cout << g.index2string(v) << "(" << g.length(e)
			     << "." << color[e] << ") ";
		}
		cout << endl;
	}
}

/** Check that a purported group coloring is valid.
 *  @param g is a reference to the graph
 *  @param color[e] is the color assigned to edge e
 *  @return true if this is a valid coloring
 */
bool beCheck(Wdigraph& g, int color[], int cmax) {
	bool status = true;

	// check that no two adjacent edges have the same color
	bool inuse[cmax+1];
	for (int c = 0; c <= cmax; c++) inuse[c] = false;
	for (vertex u = 1; u <= g.n(); u++) {
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			if (color[e] < g.length(e)) {
				cerr << "assigned color " << color[e] 
				     << " to edge " << g.edge2string(e) << endl;
				status = false;
			}
			if (inuse[color[e]] != 0) {
				cerr << "multiple edges at vertex " << u
				     << " are assigned color " << color[e]
				     << "\n";
				status = false;
				break;
			}
			inuse[color[e]] = true;
		}
		// clear inuse values
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			inuse[color[e]] = false;
		}
	}
	return status;
}
