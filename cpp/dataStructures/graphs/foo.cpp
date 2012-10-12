#include "Wgraph.h"

int main() {
        const int n = 10;
        const int m = 50;
        Wgraph wg(n,m);
        wg.rgraph(n,m);
	string s;
	cout << wg.toString(s);
}
