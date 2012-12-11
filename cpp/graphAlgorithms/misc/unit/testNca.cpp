// usage:
//	test_nca
//
// Test_nca reads a tree from stdin and a list of vertex pairs,
// then invokes the nca routine to, computes the nearest common
// ancestor for each pair. Vertex 1 is treated as the tree root.
// On completion, test_nca prints the list of pairs and their nca.

#include "Nca.h"

using namespace grafalgo;

const int maxP = 100;

int main() {
	int np; vertex x, y;
	Graph tree; tree.read(cin);
	VertexPair pairs[maxP];
	vertex ncav[maxP];

	np = 0;
	while (1) {
		Util::skipBlank(cin);
		if (!Util::verify(cin,'(') || !Util::readNode(cin,x,tree.n()) ||
		    !Util::verify(cin,',') || !Util::readNode(cin,y,tree.n()) ||
		    !Util::verify(cin,')') || np >= maxP)
			break;
		pairs[np].v1 = x; pairs[np++].v2 = y;
	}

	Nca(tree,1,pairs,np,ncav);
	string s;
	for (int i = 0; i < np; i++) {
		cout << "nca(" << Util::node2string(pairs[i].v1,tree.n(),s);
		cout << ","    << Util::node2string(pairs[i].v2,tree.n(),s);
		cout << ")="   << Util::node2string(ncav[i],tree.n(),s);
		if (i%5 == 4) cout << endl;
		else cout << " ";
	}
	if (np%5 != 0) cout << endl;
}
