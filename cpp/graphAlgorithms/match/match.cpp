// usage: match {size|weight} {bipartite|general} method
//
// Match reads a graph from stdin, computes a matching
// using the method specified by the argument and then prints the
// resulting matching.
//
// Methods currently implemented include
// 
//  size  bipartite 	altPath faltPath flowMatch
//  size  general 	edmonds
// weight bipartite 	flowMatch
//

#include "stdinc.h"
#include "UiDlist.h"
#include "Wgraph.h"
#include "altPath.h"
#include "faltPath.h"
#include "edmonds.h"
#include "fastEdmonds.h"

extern void flowMatch(Graph&,UiDlist&,int&);
extern void flowMatch(Wgraph&,UiDlist&,int&,int&);

main(int argc, char *argv[]) {
	edge e; int i, mSize, mWeight;
	bool size, bipartite;
	Graph graf; Wgraph wg;
	
	if (argc != 4)
		fatal("usage: match {size|weight} {bipartite|general} method");

	if (strcmp(argv[1],"size") == 0)  size = true;
	else if (strcmp(argv[1],"weight") == 0)  size = false;
	else fatal("usage: match {size|weight} {bipartite|general} method");

	if (strcmp(argv[2],"bipartite") == 0)  bipartite = true;
	else if (strcmp(argv[2],"general") == 0)  bipartite = false;
	else fatal("usage: match {size|weight} {bipartite|general} method");

	if ((size && graf.read(cin)) || (!size && wg.read(cin))) {}
	else fatal("match: error reading graph from stdin");

	int n = (size ? graf.n() : wg.n());
	int m = (size ? graf.m() : wg.m());

	UiDlist match(m);

	if (size && bipartite) {
		if (strcmp(argv[3],"altPath") == 0) {
			altPath(graf,match,mSize);
		} else if (strcmp(argv[3],"faltPath") == 0) {
			faltPath(graf,match,mSize);
		} else if (strcmp(argv[3],"flowMatch") == 0) {
			flowMatch(graf,match,mSize);
		} else {
			fatal("match: invalid method");
		}
	} else if (!size && bipartite) {
		if (strcmp(argv[3],"flowMatch") == 0) {
			flowMatch(wg,match,mSize,mWeight);
		} else {
			fatal("match: invalid method");
		}
	} else if (size) {
		if (strcmp(argv[3],"edmonds") == 0) {
			edmonds(graf,match,mSize);
		} else if (strcmp(argv[3],"fastEdmonds") == 0) {
			fastEdmonds(graf,match,mSize);
		} else {
			cerr << argv[3];
			fatal("match: invalid method");
		}
	} else { // no algorithms for other cases (yet)
		fatal("match: invalid method");
	}
	cout << mSize << " edges in matching";
	if (!size) cout << " with total weight " << mWeight;
	cout << endl;

	if (graf.n() > 100) exit(0); // don't print out really big matchings
	i = 0;
	for (e = match.first(); e != 0; e = match.next(e)) {
		string s;
		if (size) {
			cout << "(" << Util::node2string(graf.left(e),n,s);
			cout << "," << Util::node2string(graf.right(e),n,s);
		} else {
			cout << "(" << Util::node2string(wg.left(e),n,s);
			cout << "," << Util::node2string(wg.right(e),n,s);
			cout << "," << wg.weight(e);
		}
		cout << ") ";
		if ((++i % 5) == 0) cout << endl;
	}
	cout << endl;
}
