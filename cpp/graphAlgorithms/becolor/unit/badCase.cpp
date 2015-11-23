/** usage: badCase n 
 * 
 *  BadCase generates a weighted graph that represents an instance
 *  of the bounded edge coloring problem. The graph has n inputs, 2n-1
 *  outputs and n^2 edges.
*/

#include "stdinc.h"
#include "Graph_wd.h"

using namespace grafalgo;

int main(int argc, char *argv[]) {
	int n = 4;
	if (argc != 2 || sscanf(argv[1],"%d", &n) != 1)
		Util::fatal("usage: badCase n");
	Graph_wd g(3*n-1, n*n);
	for (vertex u = 1; u <= n; u++) {
		for (vertex v = 1; v <= u; v++) {
			edge e = g.join(u, v+n); g.setLength(e, v);
		}
		for (int i = u+1; i <= n; i++) {
			edge e = g.join(u, 2*n+u); g.setLength(e, i);
		}
	}
	cout << g;
}
