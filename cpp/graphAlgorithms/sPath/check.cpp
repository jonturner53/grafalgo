// usage:
//	check [src]
//
// check reads two graphs from stdin, and checks to see
// if the second is a shortest path tree of the first.
// It prints a message for each discrepancy that it finds.
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "List.h"
#include "Wdigraph.h"

using namespace grafalgo;

void check(int, Wdigraph&, Wdigraph&);

int main(int argc, char *argv[]) {
	int s = 1;
	if (argc == 2 && sscanf(argv[1],"%d",&s) != 1)
		Util::fatal("usage: check [src]");
	Wdigraph dig; cin >> dig;
	Wdigraph sptree; cin >> sptree;
	check(s,dig,sptree);
}

void check(int s, Wdigraph& dig, Wdigraph& sptree) {
// Verify that sptree is a shortest path tree of dig.
	vertex u,v; edge e, f;

	// check size of sptree matches dig
	if (sptree.n() != dig.n() || sptree.m() != sptree.n()-1)
		Util::fatal("spt_check: size error, aborting");

	// check that sptree is a subgraph of dig
	for (v = 1; v <= sptree.n(); v++) {
		if (v == s) continue;
		f = sptree.firstIn(v);
		if (f == 0) 
			cout << "check: non-root vertex " << v
			     << " has no incoming edge\n";
		u = sptree.tail(f);
		for (e = dig.firstIn(v); ; e = dig.nextOut(v,e)) {
			if (e == 0) {
				cout << "check: edge (" << u << "," << v
				     << ") in sptree is not in dig\n";
			}
			if (dig.tail(e) == u) break;
		}
	}

	// check that sptree reaches all the vertices
	bool* mark = new bool[sptree.n()+1]; int marked;
	for (u = 1; u <= sptree.n(); u++) mark[u] = false;
	mark[s] = true; marked = 1;
	List q(dig.n()); q.addLast(s);
	while (!q.empty()) {
		u = q.first(); q.removeFirst();
		for (e = sptree.firstOut(u); e != 0; e = sptree.nextOut(u,e)) {
			v = sptree.head(e);
			if (!mark[v]) {
				q.addLast(v); mark[v] = true; marked++;
			}
		}
	}
	if (marked != sptree.n()) {
		cout << "check: sptree does not reach all vertices\n";
		return;
	}

	// check that tree is minimum
	int du, dv; 
	for (u = 1; u <= dig.n(); u++) {
		du = sptree.firstIn(u) == 0 ?
		     0 : sptree.length(sptree.firstIn(u));
		for (e = dig.firstOut(u); e != 0; e = dig.nextOut(u,e)) {
			v = dig.head(e);
			dv = sptree.firstIn(v) == 0 ?
			     0 : sptree.length(sptree.firstIn(v));
			if (dv > du + dig.length(e))
				cout << "check: " << dig.edge2string(e)
				     << ") violates spt condition\n";
			if (sptree.firstIn(v) != 0 && 
			    sptree.tail(sptree.firstIn(v)) == u && 
			    dv != du + dig.length(e))
				cout << "check: tree edge "
				     << dig.edge2string(e)
				     << " violates spt condition\n";
		}
	}
}
