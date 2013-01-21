/** @file minFlow.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Flograph.h"
#include "ppHiLab.h"

/** Find maximum flow in flow graph with min capacity constraints.
 *  @param fg is the flow graph
 *  @param minFlo[e] is the minimum flow required on edge e in fg
 *  @param floVal on return, floVal is the value of the computed flow;
 *  if there is no feasible flow for the given min flows, -1 is returned.
 */
void minFlow(Flograph& fg, flow minFlo[], int& floVal) {
	// Create separate ordinary flow graph for use in first phase
	// This graph adds a high capacity edge from the current sink to the
	// source, then substitutes new source and sink vertices with edges
	// to/from every edge in fg with a min flow requirement
	int n2 = fg.n() + 2; int m2 = fg.m() + 1;
	flow minTotals;
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		if (minFlo[e] > 0) {
			m2++; minTotals += minFlo[e];
		}
	}
	Flograph fg2(n2,m2,n2-1,n2);
	edge e2 = fg2.join(fg.snk(),fg.src());
	fg2.setCapacity(e2,Util::BIGINT32);
	edge *maps2 = new edge[m2+1]; // map edge #s from fg2 to fg
	maps2[e2] = 0;
	for (edge e = fg.first(); e != 0; e = fg.next(e)) {
		vertex u = fg.tail(e); vertex v = fg.head(e);
		if (minFlo[e] > 0) {
			e2 = fg2.join(fg2.src(),v);
			fg2.setCapacity(e2,minFlo[e]);
			maps2[e2] = e;
			e2 = fg2.join(u,fg2.snk());
			fg2.setCapacity(e2,minFlo[e]);
			maps2[e2] = 0;
		} else {
			e2 = fg2.join(u,v);
			fg2.setCapacity(e2,fg.cap(fg.tail(e),e));
			maps2[e2] = e;
		}
	}
	flow floVal2; ppHiLab(fg2,floVal2,true);
	if (floVal2 < minTotals) { floVal = -1; return; }
	
	// temporarily reduce edge capacities in fg
	for (e2 = fg2.first(); e2 != 0; e2 = fg2.next(e2)) {
		edge e = maps2[e2];
		if (e == 0) continue;
		fg.setCapacity(e,fg.cap(fg.tail(e),e)-fg2.f(fg2.tail(e2),e2));
	}
	ppHiLab(fg,floVal,true);
	
	// now add flow in fg2 to fg and restore capacites
	for (e2 = fg2.first(); e2 != 0; e2 = fg2.next(e2)) {
		edge e = maps2[e2];
		if (e == 0) continue;
		fg.setCapacity(e,fg.cap(fg.tail(e),e)+fg2.f(fg2.tail(e2),e2));
		fg.addFlow(fg.tail(e),e,fg2.f(fg2.tail(e2),e2));
	}
	floVal += floVal2;
}
