/** @file Rgraph.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef RGRAPH_H
#define RGRAPH_H

#include "Adt.h"
#include "Wgraph.h"
#include "Wdigraph.h"
#include "Wflograph.h"
#include "Mflograph.h"

namespace grafalgo {

/** Static class for generating random graphs of various kinds.  */
class Rgraph {
public:

	static void ugraph(Graph&, int, int);
	static void bigraph(Graph&, int, int, int);
	static void tree(Graph&, int);
	static void connected(Graph&, int,int);
	static void addEdges(Graph&, int);
	static void addEdges(Graph&, int, int, int);
	static void digraph(Digraph&, int, int);
	static void dag(Digraph&, int, int);
	static void flograph(Flograph&, int, int, int);

	static void edgeWeight(Wgraph&, int, int);
	static void edgeLength(Wdigraph&, int, int);
	static void edgeCapacity(Flograph&, int, int);
	static void edgeCost(Wflograph&, int, int);
	static void edgeMinFlo(Mflograph&, int, int);

	static void scramble(Graph&);
	static void scramble(Wgraph&);
	static void scramble(Wdigraph&);
	static void scramble(Flograph&);
	static void scramble(Wflograph&);
	static void scramble(Mflograph&);

	static void shuffle(Graph&, int*, int*);
	static void shuffle(Wgraph&, int*, int*);
	static void shuffle(Wdigraph&, int*, int*);
	static void shuffle(Flograph&, int*, int*);
	static void shuffle(Wflograph&, int*, int*);
	static void shuffle(Mflograph&, int*, int*);

private:
	static void shuffleEdges(Graph&, int*, int*);
	static void shuffleFloInfo(Flograph&, int*, int*);
};

} // ending namespace

#endif
