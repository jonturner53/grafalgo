/** @file badcase.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 *
 *  usage: badCase k1 k2
 * 
 *  BadCase generates a flow graph that requires a long time
 *  to complete, using most max flow algorithms.
 *  k1 and k2 are parameters that control the size of the
 *  instance. The graphs have approximately 24*k1 + 2*k2
 *  vertices and 18*k1 + k2^2 edges. Keep k1=k2 to get
 *  dense graphs. Use k2<k1 to get more sparse graphs.
 */

#include "Adt.h"
#include "Util.h"
#include "Flograph.h"

using namespace grafalgo;

void badcase(int, int, Flograph&);

int main(int argc, char* argv[]) {
	int k1, k2;

	if (argc != 3 || (sscanf(argv[1],"%d",&k1)) != 1 ||
			 (sscanf(argv[2],"%d",&k2)) != 1)
		Util::fatal("usage badCase k1 k2");

	Flograph fg(10,20);
	badcase(k1,k2,fg);

	string s;
	cout << fg;
}

void badcase(int k1, int k2, Flograph& fg) {
	int i,j, n, m, c1, c2, c3, c4, bl, br;
	edge e;

	// determine first vertex in each group
	c1 = 2;			// start of short chain from source
	c2 = c1 + 4*(k1-1)+1;	// start of long chain from source
	bl = c2 + 4*(k1-1)+3;	// start of 1st vertex group in bipartite graph
	br = bl + k2;		// start of 2nd vertex group in bipartite graph
	c3 = br + k2;		// start of long chain to sink
	c4 = c3 + 4*(k1-1)+3;	// start of short chain to sink

	n = c4 + 4*(k1-1)+1;
	m = 16*(k1-1) + k2*k2 + 8*k1 + 4;	
	fg.resize(n,m);
	fg.setSrc(1); fg.setSnk(n);

	// build short chain from source
	for (i = 0; c1+i < c2; i++) {
		if ((i%4) == 0) { 
			e = fg.join(fg.src(),c1+i); 
			if (i == 0) fg.setCapacity(e,k2*k2*k2);
			else fg.setCapacity(e,k2*k2);
		}
		if (c1+i < c2-1) { 
			e = fg.join(c1+i,c1+i+1); fg.setCapacity(e,2*k2*k2*k2);
		}
	}
	// build long chain from source
	for (i = 0; c2+i < bl; i++) {
		if ((i%4) == 0) { 
			e = fg.join(fg.src(),c2+i);
			if (i == 0) fg.setCapacity(e,k2*k2*k2);
			else fg.setCapacity(e,k2*k2);
		}
		if (c2+i < bl-1) { 
			e = fg.join(c2+i,c2+i+1); fg.setCapacity(e,2*k2*k2*k2);
		}
	}
	// connect source chains to bipartite graph
	for (i = 0; i < k2; i++) {
		e = fg.join(c2-1,bl+i); fg.setCapacity(e,2*k2*k2); 
		e = fg.join(bl-1,br+i); fg.setCapacity(e,2*k2*k2);
	}
	// build central bipartite graph
	for (i = 0; i < k2; i++) {
		for (j = 0; j < k2; j++) {
			e = fg.join(bl+i, br+j); fg.setCapacity(e,1);
		}
	}
	// connect bipartite graph to sink chains
	for (i = 0; i < k2; i++) {
		e = fg.join(bl+i,c3); fg.setCapacity(e,2*k2*k2); 
		e = fg.join(br+i,c4); fg.setCapacity(e,2*k2*k2);
	}
	// build long chain to sink
	for (i = 0; c3+i < c4; i++) {
		if ((i%4) == 2) {
			e = fg.join(c3+i,fg.snk()); fg.setCapacity(e,k2*k2);
		}
		if (c3+i < c4-1) { 
			e = fg.join(c3+i,c3+i+1); fg.setCapacity(e,2*k2*k2*k2);
		}
	}
	// build short chain to sink
	for (i = 0; c4+i < n; i++) {
		if ((i%4) == 0) { 
			e = fg.join(c4+i,fg.snk()); fg.setCapacity(e,k2*k2);
		}
		if (c4+i < n-1) { 
			e = fg.join(c4+i,c4+i+1); fg.setCapacity(e,2*k2*k2*k2);
		}
	}
}

