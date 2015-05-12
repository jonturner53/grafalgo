/** usage: testGcolor method [k] [ show verify ]
 * 
 *  TestGcolor reads a grou graph from stdin, and computes a group edge
 *  coloring using the method specified by the argument. If the verify 
 *  argument is present (the string "verify"), the resulting coloring is
 *  checked for correctness, and a message is printed for each violation.
 * 
 *  Methods currently implemented include basicLayers, thinLayers, minColor,
 *  recolor, fewColors. FewColors requires an integer parameter k>0
*/

#include "stdinc.h"
#include "GroupGraph.h"
#include "egBasicLayers.h"
#include "egThinLayers.h"
#include "egMinColor.h"
#include "egRecolor.h"
#include "egFewColors.h"

using namespace grafalgo;

bool gcCheck(GroupGraph&, int[]);

int main(int argc, char *argv[]) {
	if (argc < 2)
		Util::fatal("usage: color method [k] [ show verify ]");
		
	GroupGraph g; cin >> g;
	int color[g.M()+1];
	for (edge e = 0; e <= g.M(); e++) color[e] = 0;

	int numColors = 0;
	if (strcmp(argv[1],"basicLayers") == 0) {
		egBasicLayers(g,color);
	} else if (strcmp(argv[1],"thinLayers") == 0) {
		egThinLayers(g,color);
	} else if (strcmp(argv[1],"minColor") == 0) {
		egMinColor(g,color);
	} else if (strcmp(argv[1],"recolor") == 0) {
		egRecolor(g,color);
	} else if (strcmp(argv[1],"fewColors") == 0) {
		int k = 1;
		if (argc < 3 || sscanf(argv[2],"%d",&k) != 1)
			Util::fatal("usage: color method [k] [ show verify ]");
		egFewColors(g,k,color);
	} else {
		Util::fatal("testColor: invalid method");
	}
	numColors = 0;
	for (edge e = g.first(); e != 0; e = g.next(e))
		numColors = max(numColors, color[e]);
	cout << numColors << endl;

	bool show = false; bool verify = false;
	for (int i = 2; i < argc; i++) {
		     if (strcmp(argv[i],"show") == 0) show = true;
		else if (strcmp(argv[i],"verify") == 0) verify = true;
	}
	if (verify) gcCheck(g, color);
	if (!show) exit(0);
	cout << g;
	for (int c = 1; c <= numColors; c++) {
		cout << c << ":";
		for (vertex u = 1; u <= g.n(); u++) {
			for (int grp = g.firstGroup(u); grp != 0;
				 grp = g.nextGroup(u,grp)) {
				bool first = true;
				bool impure = false;
				for (edge e = g.firstEdgeInGroup(grp); e != 0;
					  e = g.nextEdgeInGroup(grp,e)) {
					if (color[e] == c) {
						if (first)
							cout << " " <<
							     g.index2string(u)
							     << "(";
						else
							cout << " ";
						cout << g.index2string(
								g.output(e));
						first = false;
					} else {
						impure = true;
					}
				}
				if (!first) {
					if (impure) cout << ".";
					cout << ")";
				}
			}
		}
/*
		for (edge e = g.first(); e != 0; e = g.next(e)) {
			if (color[e] == c) {
				cout << g.edge2string(e) << " ";
			}
		}
*/
		cout << endl;
	}
}

/** Check that a purported group coloring is valid.
 *  @param g is a reference to the graph
 *  @param color[e] is the color assigned to edge e
 *  @return true if this is a valid coloring
 */
bool gcCheck(GroupGraph& g, int color[]) {
	bool status = true;

	// check that no two adjacent edges have the same color
	// unless they're in the same group
	int inuse[g.M()];
	for (int c = 1; c <= g.n(); c++) inuse[c] = 0;
	for (vertex u = 1; u <= g.n(); u++) {
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			if (inuse[color[e]] != 0 &&
			    inuse[color[e]] != g.groupNumber(e)) {
				cerr << "multiple groups at vertex " << u
				     << " are assigned color " << color[e]
				     << "\n";
				status = false;
				break;
			}
			inuse[color[e]] = g.groupNumber(e);
		}
		// clear inuse values
		for (edge e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
			inuse[color[e]] = 0;
		}
	}
	return status;
}
