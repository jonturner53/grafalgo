#include "stdinc.h"
#include "List.h"
#include "Wdigraph.h"

using namespace grafalgo;

void bfScan(Wdigraph& dig, vertex s, vertex p[], int d[]) {
// Compute shortest path tree using breadth-first scanning algorithm.
	int pass; vertex v,w,last; edge e;
	List q(dig.n());

	for (v = 1; v <= dig.n(); v++) { p[v] = 0; d[v] = Util::BIGINT32; }
	d[s] = 0; q.addLast(s); pass = 0; last = s;

	while (!q.empty()) {
		v = q.first(); q.removeFirst();
		for (e = dig.firstOut(v); e != 0; e = dig.nextOut(v,e)) {
			w = dig.head(e);
			if (d[v] + dig.length(e) < d[w]) {
				d[w] = d[v] + dig.length(e); p[w] = v;
				if (!q.member(w)) q.addLast(w);
			}
		}
		if (v == last && !q.empty()) { pass++; last = q.last(); }
		if (pass == dig.n())
			Util::fatal("bfScan: graph has negative cycle");
	}
}
