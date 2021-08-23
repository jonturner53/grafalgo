/** @file toDot.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.

Defer for now. May switch to other method for graphic presentation.

 */

#include "stdinc.h"
#include "Adt.h"
#include "Graph_w.h"
#include "Graph_wd.h"
#include "Graph_wf.h"

using namespace grafalgo;

/** usage: toDot type
 * 
 *  Read a graph from stdin and write it out in dot format.
 *  Dot is one of several graph-drawing utilities in the popular
 *  graphViz package.
 * 
 *  The allowed values of type are ugraph, wgraph,
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
		Graph_w wg; cin >> wg; cout << wg.toDotString();
	} else if (strcmp(argv[1],"digraph") == 0) {
		Graph_d dig; cin >> dig; cout << dig.toDotString();
	} else if (strcmp(argv[1],"wdigraph") == 0) {
		Graph_wd wdig; cin >> wdig; cout << wdig.toDotString();
	} else if (strcmp(argv[1],"flograph") == 0) {
		Graph_f fg; cin >> fg; cout << fg.toDotString();
	} else if (strcmp(argv[1],"wflograph") == 0) {
		Graph_wf wfg; cin >> wfg; cout << wfg.toDotString();
	} else {
		Util::fatal("usage: toDot type");
	}
}
