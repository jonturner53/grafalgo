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
#include "GroupGraph.h"
#include "HashSet.h"
#include "Dheap.h"

namespace grafalgo {

/** Static class for generating random graphs of various kinds.  */
class Rgraph {
public:

	static void ugraph(Graph&, int, int);
	static void bigraph(Graph&, int, int, int);
	static void tree(Graph&, int);
	static void regular(Graph&, int, int);
	static void regularBigraph(Graph&, int, int);
	static void regularBigraph(Graph&, int, int, int);
	static void regularBiMultigraph(Graph&, int, int, int);
	static void beColor(Wdigraph&, int, int, int, int);
	static void connected(Graph&, int,int);
	static void addEdges(Graph&, int);
	static void addEdges(Graph&, int, int, int);
	static void digraph(Digraph&, int, int);
	static void dag(Digraph&, int, int);
	static void flograph(Flograph&, int, int, int);
	static void groupGraph(GroupGraph&, int, int, int, int, int);

	static void setWeights(Wgraph&, int, int);
	static void setLengths(Wdigraph&, int, int);
	static void setCapacities(Flograph&, int, int);
	static void setCosts(Wflograph&, int, int);
	static void setMinFlows(Mflograph&, int, int);

	template<class T> static void scramble(T&);

	static void shuffle(Graph&, int*, int*);
	static void shuffle(Wgraph&, int*, int*);
	static void shuffle(Wdigraph&, int*, int*);
	static void shuffle(Flograph&, int*, int*);
	static void shuffle(Wflograph&, int*, int*);
	static void shuffle(Mflograph&, int*, int*);
	static void shuffle(GroupGraph&, int*, int*);

private:
	static bool tryRegular(Graph&, int, int);
};

/** Scramble the vertices and edges in a graph.
 *  @param graf is a graph object (Graph, Wgraph, Digraph,...);
 *  on return the vertices and edge numbers are permuted to give
 *  a graph that is structurally identical to the original but
 *  which "looks different"
 */
template<class T>
void Rgraph::scramble(T& g) {
        int *vp = new int[g.n()];
	int *ep = new int[g.M()];
        Util::genPerm(g.n(),vp); Util::genPerm(g.M(),ep);
        shuffle(g,vp,ep);
        g.sortAdjLists();
}

} // ending namespace

#endif
