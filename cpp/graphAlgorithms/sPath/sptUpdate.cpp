// usage: sptUpdate n m maxLen repCount seed
//
// sptUpdate generates a random graph on n vertices with m edges.
// It then computes a shortest path tree of the graph then repeatedly
// modifies the shortest path tree by randomly changing the weight
// of one of the edges. The edge lengths are distributed in [1,maxLen].
//
// This program is not bullet-proof. Caveat emptor.

#include "stdinc.h"
#include "List.h"
#include "Dheap.h"
#include "Wdigraph.h"
#include "Rgraph.h"

using namespace grafalgo;

void dijkstra(Wdigraph&, vertex, vertex*, int*);
int sptUpdate(Wdigraph&, vertex*, int*, edge, int);
void check(Wdigraph&, Wdigraph&);

int main(int argc, char* argv[]) {
	int i, n, m, maxLen, repCount, retVal, seed;
	int notZero, minTsiz, maxTsiz, avgTsiz;
	edge e; Wdigraph dig;

	if (argc != 6 ||
	    sscanf(argv[1],"%d",&n) != 1 ||
	    sscanf(argv[2],"%d",&m) != 1 ||
	    sscanf(argv[3],"%d",&maxLen) != 1 ||
	    sscanf(argv[4],"%d",&repCount) != 1 ||
	    sscanf(argv[5],"%d",&seed) != 1)
		Util::fatal("usage: sptUpdate n m maxLen repCount seed");

	srandom(seed);
	Rgraph::digraph(dig,n,m); Rgraph::edgeLength(dig,0,maxLen);

	vertex *p = new int[n+1]; int *d = new int[n+1];
	dijkstra(dig,1,p,d);

	notZero = 0; minTsiz = dig.n(); maxTsiz = 0; avgTsiz = 0;
	for (i = 1; i <= repCount; i++) {
		e = Util::randint(1,dig.m());
		retVal = sptUpdate(dig,p,d,e,Util::randint(1,maxLen));
		if (retVal > 0) {
			notZero++;
			minTsiz = min(retVal,minTsiz);
			avgTsiz += retVal;
			maxTsiz = max(retVal,maxTsiz);
		}
	}

	cout << setw(6) << notZero << " " << setw(2) << minTsiz
	     << " " << (notZero > 0 ? double(avgTsiz)/notZero : 0.0)
	     << " " << setw(4) << maxTsiz;
}

int sptUpdate(Wdigraph& dig, vertex p[], int d[], edge e, int nuLen) {
// Given a graph dig and an SPT sptree, update the SPT and distance vector to
// reflect the change in the weight of edge e to nuLen.
// Return 0 if no change is needed. Otherwise, return the number
// of vertices in the subtree affected by the update.
	vertex u, v, x, y; edge f;
	int oldLen, tSiz;
	static int n=0; static Dheap *nheap; static List *stList;

	// Allocate new heap and List if necessary.
	// For repeated calls on same graph, this is only done once.
	if (dig.n() > n) { 
		if (n > 0) { delete nheap; delete stList; }
		n = dig.n();
		nheap = new Dheap(dig.n(),2);
		stList = new List(dig.n());
	}

	u = dig.tail(e); v = dig.head(e);
	oldLen = dig.length(e); dig.setLength(e,nuLen);

	// case 1 - non-tree edge gets more expensive
	if (p[v] != u && nuLen >= oldLen) return 0;

	// case 2 - non-tree edge gets less expensive, but not enough
	// to change anything
	if (p[v] != u && d[u] + nuLen >= d[v]) return 0;

	// In the above two cases, nv=0 and the running time is O(1)
	// as required.

	// case 3 - edge gets less expensive and things change
	if (nuLen < oldLen) {
		// start Dijkstra's algorithm from v
		p[v] = u; d[v] = d[u] + nuLen;
		nheap->insert(v,d[v]);
		tSiz = 0;
		while (!nheap->empty()) {
			x = nheap->deletemin();
			for (f = dig.firstOut(x); f !=0; f = dig.nextOut(x,f)) {
				y = dig.head(f);
				if (d[y] > d[x] + dig.length(f)) {
					d[y] = d[x] + dig.length(f); p[y] = x;
					if (nheap->member(y))
						nheap->changekey(y,d[y]);
					else
						nheap->insert(y,d[y]);
				}
			}
			tSiz++;
		}
		return tSiz;
	}
	// In case 3, the vertices affected by the update are those that
	// get inserted into the heap. Hence, the number of executions of
	// the outer loop is O(nv). The inner loop iterates over edges
	// incident to the vertices for which the distance changes, hence
	// the number of calls to changekey is O(mv). The d-heap parameter
	// is 2, which gives us an overall running time of O((mv log nv).

	// case 4 - tree edge gets more expensive

	// Put vertices in subtree into list.
	stList->clear(); stList->addLast(v); x = v; tSiz = 0;
	do {
		tSiz++;
		for (f = dig.firstOut(x); f != 0; f = dig.nextOut(x,f)) {
			y = dig.head(f);
			if (p[y] == x) {
				if (stList->member(y)) {
					string s1;
					cout <<  "u=" << u << " v=" << v
					     << " x=" << x << " y=" << y 
					     << endl << stList->toString(s1);
				}
				stList->addLast(y);
			}
		}
		x = stList->next(x);
	} while (x != 0);

	// The time for the above loop is O(nv+mv)

	// Insert vertices in the subtree with incoming edges into heap.
	for (x = stList->first(); x != 0; x = stList->next(x)) {
		// find best incoming edge for vertex x
		p[x] = 0; d[x] = Util::BIGINT32;
		for (f = dig.firstIn(x); f != 0; f = dig.nextIn(x,f)) {
			y = dig.tail(f);
			if (!stList->member(y) && d[y] + dig.length(f) < d[x]) {
				p[x] = y; d[x] = d[y] + dig.length(f);
			} 
		}
		if (p[x] != 0) nheap->insert(x,d[x]);
	}

	// The time for the above loop is  O(mv + nvlog nv)

	// Run Dijkstra's algorithm on the vertices in the subtree.
	while (!nheap->empty()) {
		x = nheap->deletemin();
		for (f = dig.firstOut(x); f != 0; f = dig.nextOut(x,f)) {
			y = dig.head(f);
			if (d[y] > d[x] + dig.length(f)) {
				d[y] = d[x] + dig.length(f); p[y] = x;
				if (nheap->member(y)) nheap->changekey(y,d[y]);
				else nheap->insert(y,d[y]);
			}
		}
	}
	// Same as earlier case. The outer loop is executed nv times,
	// the inner loop mv times. So the overall running time is
	// O(mv log nv).
	return tSiz;
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
		for (e = dig.firstIn(v); ; e = dig.nextIn(v,e)) {
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
	int du, dv; string s1;
	for (u = 1; u <= dig.n(); u++) {
		du = sptree.firstIn(u) == 0 ?
		     0 : sptree.length(sptree.firstIn(u));
		for (e = dig.firstOut(u); e != 0; e = dig.nextOut(u,e)) {
			v = dig.head(e); edge vpe = sptree.firstIn(v);
			dv = vpe == 0 ?  0 : sptree.length(vpe);
			if (dv > du + dig.length(e))
				cout << "check: " << dig.edge2string(e,s1)
			      	     << " violates spt condition\n";
			if (vpe != 0 && sptree.tail(vpe) == u && 
			    dv != du + dig.length(e))
				cout << "check: tree edge "
				     << sptree.edge2string(vpe,s1)
			      	     << " violates spt condition\n";
		}
	}
}
