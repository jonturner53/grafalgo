// usage:
//	test_nca
//
// Test_nca reads a tree from stdin and a list of vertex pairs,
// then invokes the nca routine to, computes the nearest common
// ancestor for each pair. Vertex 1 is treated as the tree root.
// On completion, test_nca prints the list of pairs and their nca.

#include "Nca.h"

using namespace grafalgo;

int main() {
	Graph tree; cin >> tree;
	Graph pairs(tree.n(),10); cin >> pairs;
	cout << tree << pairs;

	vertex ncav[pairs.m()+1];
	Nca(tree,1,pairs,ncav);
	int i = 0;
	for (edge e = pairs.first(); e != 0; e = pairs.next(e)) {
		cout << pairs.edge2string(e)
		     << ":" << tree.index2string(ncav[e]);
		if ((++i%8) == 0) cout << endl;
		else cout << " ";
	}
	if ((i%8) != 0) cout << endl;
}
