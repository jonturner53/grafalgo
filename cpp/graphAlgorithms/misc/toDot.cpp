/** @file toDot.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Adt.h"
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"

using namespace grafalgo;

/** usage: toDot type
 * 
 *  Read a graph from stdin and write it out in dot format.
 *  Dot is one of several graph-drawing utilities in the popular
 *  graphViz package.
 * 
 *  The allowed values of type are graph, wgraph,
 *  digraph, wdigraph, flograph, wflograph.
 *
 *  The output graph can be piped to "dot -Tpdf >foo.pdf"
 *  to create a pdf file containing a graphical presentation.
 */
int main(int argc, char *argv[]) { 

	if (argc != 2) Util::fatal("usage: toDot type");

	if (strcmp(argv[1],"ugraph") == 0) {
		Graph g; cin >>g; cout << g.toDotString();
	} else if (strcmp(argv[1],"wgraph") == 0) {
		Wgraph wg; cin >> wg; cout << wg.toDotString();
	} else if (strcmp(argv[1],"digraph") == 0) {
		Digraph dig; cin >> dig; cout << dig.toDotString();
	} else if (strcmp(argv[1],"wdigraph") == 0) {
		Wdigraph wdig; cin >> wdig; cout << wdig.toDotString();
	} else if (strcmp(argv[1],"flograph") == 0) {
		Flograph fg; cin >> fg; cout << fg.toDotString();
	} else if (strcmp(argv[1],"wflograph") == 0) {
		Wflograph wfg; cin >> wfg; cout << wfg.toDotString();
	} else {
		Util::fatal("usage: toDot type");
	}
}
