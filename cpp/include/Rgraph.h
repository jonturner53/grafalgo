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
#include "Graph_w.h"
#include "Graph_wd.h"
#include "Graph_wf.h"
#include "Graph_ff.h"
#include "Graph_g.h"
#include "Set_h.h"
#include "Heap_d.h"

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
	static void becolor(Graph_wd&, int, int, int, int, double);
	static void connected(Graph&, int,int);
	static void addEdges(Graph&, int);
	static void addEdges(Graph&, int, int, int);
	static void digraph(Graph_d&, int, int);
	static void dag(Graph_d&, int, int);
	static void flograph(Graph_f&, int, int, int);
	static void groupGraph(Graph_g&, int, int, int, int, int);

	static void setWeights(Graph_w&, int, int);
	static void setLengths(Graph_wd&, int, int);
	static void setCapacities(Graph_f&, int, int);
	static void setCosts(Graph_wf&, int, int);
	static void setMinFlows(Graph_ff&, int, int);

	template<class T> static void scramble(T&);

	static void shuffle(Graph&, int*, int*);
	static void shuffle(Graph_w&, int*, int*);
	static void shuffle(Graph_wd&, int*, int*);
	static void shuffle(Graph_f&, int*, int*);
	static void shuffle(Graph_wf&, int*, int*);
	static void shuffle(Graph_ff&, int*, int*);
	static void shuffle(Graph_g&, int*, int*);

private:
	static bool tryRegular(Graph&, int, int);
};

/** Scramble the vertices and edges in a graph.
 *  @param graf is a graph object (Graph, Graph_w, Graph_d,...);
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
