 /** @file Random.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fatal } from './Errors.mjs';
import List from './dataStructures/basic/List.mjs';
import Dheap from './dataStructures/heaps/Dheap.mjs';
import Graph from './dataStructures/graphs/Graph.mjs';
import Digraph from './dataStructures/graphs/Digraph.mjs';
import Flograph from './dataStructures/graphs/Flograph.mjs';
import mflo_dinic from './graphAlgorithms/mflow/mflo_dinic.mjs';

console.log(randomTree(10).toString(0,1));

// Return a random number in [0,1] 
export function randomFraction() {
	return Math.random();
}

/** Return a random integer in the range [lo,hi].
 *  @param lo is an integer
 *  @param hi is a larger integer
 *  @return an integer in the range [lo, hi] (inclusive)
 */
export function randomInteger(lo, hi) {
	lo = Math.floor(lo); hi = Math.floor(hi);
	return lo + Math.floor(Math.random() * ((hi+1) - lo));
}

// Return a random number from an exponential distribution with mean mu 
export function randomExp(mu) {
	return -mu * Math.log(randomFraction());
}

/** Return a random number from a geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @return a random sample
 */
export function randomGeometric(p) {
	if (p > .999999999) return 1.0;
	let x = (.999999999 + Math.log(randomFraction())/Math.log(1-p));
	return Math.max(1, x);
}

/** Return a random number from a truncated geometric distribution.
 *  @param p is 1/(the mean of the distribution)
 *  @param k is the max value in the distribution
 *  @return a random sample
 */
export function randomTruncatedGeometric(p, k) {
	let x = 1 - Math.exp((k-1)*Math.log(1-p));
	let r = .999999999 + Math.log(randomFraction()/x) / Math.log(1-p);
	return ((p > .999999999) ? 1 : Math.max(1,Math.min(Math.floor(r), k)));
}

/** Return a random number from a Pareto distribution.
 *  @param mu is the mean of the distribution
 *  @param s is the shape parameter
 *  @return a random sample
 */
export function randomPareto(mu, s) {
	return mu*(1-1/s) / Math.exp((1/s)*Math.log(randfrad()));
}

/** Create random permutation.
 *  @param n is an integer
 *  @return an array containing a random permutation on [1, n].
 *  in the entries with indices in [1, n]
 */
export function randomPermutation(n) {
	let p = new Array(n);
	for (let i = 0; i < n; i++) p[i] = i;
	scramble(p);
	return p;
}

/** Scramble an array, that is permute the entries randomly.
 *  @param a is an array of values
 */
export function scramble(a) {
	for (let i = 0; i < a.length; i++) {
		let j = randomInteger(i, a.length-1);
		let k = a[i]; a[i] = a[j]; a[j] = k;
	}
}

/** Generate an undirected random graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
 */  
export function randomGraph(n, m) {
	let g = new Graph(n, m);
	add2graph(g, m, true);
	return g;
}

/** Generate a random directed graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
 */  
export function randomDigraph(n, m) {
	let g = new Digraph(n, m);
	add2graph(g, m, false);
	return g;
}

/** Generate a random directed acyclic graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
 *  @return the random graph; note, returned graph has vertices in
 *  topologically sorted order.
 */  
export function randomDag(n, m) {
	let g = new Digraph(n, m);
	add2graph(g, m, true);
	return g;
}

/** Add random edges to yield a random simple graph.
 *  @param g is a graph
 *  @param m is the target number of edges; if the graph already
 *  has some edges, they are assumed to be unique; additional edges
 *  are added until the graph has m edges
 *  @param up is a flag; if true, add edges from collection of pairs
 *  [u,v] where u<v; if false pairs are not constrained
 */
function add2graph(g, m, up=false) {
	if (m <= g.m) return;
	assert(m <= (up ? g.n*(g.n-1)/2 : g.n*g.n-1),
		   'Random.addEdges: too many edges')

	// generate vector of candidate edges to select new edges from
	let pairs = [];
	if (m/g.n > g.n/4) { // dense graphs
		// build complete vector of candidate edges
		pairs = new Array(up ? g.n*(g.n-1)/2 : g.n*(g.n-1));
		let i = 0;
		for (let u = 1; u <= g.n; u++) {
			if (up) {
				for (let v = u+1; v <= g.n; v++)
					pairs[i++] = [u, v];
			} else {
				for (let v = 1; v <= g.n; v++)
					if (v != u) pairs[i++] = [u, v];
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pairs = new Array(m + Math.max(m, 200));
		for (let i = 0; i < pairs.length; i++) {
			pairs[i]    = [ randomInteger(1, g.n-1), 0 ];
			if (up) {
				pairs[i][1] = randomInteger(pairs[i][0]+1, g.n)
			} else {
				let j = randomInteger(1, g.n-1);
				pairs[i][1] = j<i ? j : j+1;
			}
		}
		sortReduce(pairs);
		removeDuplicates(pairs, g);
		if (pairs.length < m - g.m)
			fatal("Rgraph: program error, too few candidate edges");
	}
	samplePairs(pairs, g, m);
	g.sortAllEplists();
}

/** Sort vector of pairs and remove duplicates */
function sortReduce(pairs) {
	pairs.sort((a,b) => (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 :
						(a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0)))));
	let i = 0; let j = 1;
	while (j < pairs.length) {
		if (pairs[j][0] != pairs[i][0] || pairs[j][1] != pairs[i][1])
			pairs[++i] = pairs[j];
		j++;
	}
	pairs.length = i+1;
}

/** Remove pairs that already appear as edges in g.
 *  Pairs assumed to be sorted.
 */
function removeDuplicates(pairs, g) {
	// mark current edges in list of pairs and count them
	let i = 0; let nabors = new List(g.n);
	for (let u = 1; u <= g.n && i < pairs.length; u++) {
		if (u < pairs[i][0]) continue;
		// build list of u's neighbors
		nabors.clear();
		for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e))
			nabors.enq(g.mate(u,e));
		// mark pairs that are already u's neighbors
		while (i < pairs.length && pairs[i][0] == u) {
			if (nabors.contains(pairs[i][1]))
				pairs[i][0] = 0;
			i++;
		}
	}

	// remove current edges from pairs by shifting entries
	i = 0; let j = 0;
	while (j < pairs.length) {
		if (pairs[j][0] == 0) j++;
		else 				  pairs[i++] = pairs[j++];
	}
	pairs.length = i;
}

/** Add edges to graph by sampling array of pairs. */
function samplePairs(pairs, g, m) {
	// sample from remaining pairs
	let k = pairs.length - 1;
	while (g.m < m) {
		let i = randomInteger(0,k);
		g.join(pairs[i][0], pairs[i][1]);
		pairs[i] = pairs[k--];
	}
}

/** Generate a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param m is the desired number of edges in the random graph;
 *  cannot exceed n1*n2
 */
export function randomBigraph(n1, n2, m) {
	n1 = Math.max(1,n1); n2 = Math.max(1,n2); m = Math.min(n1*n2, m);
	let g = new Graph(n1+n2, m);
	add2bipartite(g, n1, n2, m);
	return g;
}

/** Add edges to form a random bipartite graph.
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param m is the desired number of edges in the graph
 */
function add2bipartite(g, n1, n2, m) {
	if (m <= g.m) return;
	assert(m <= n1*n2);
	let pairs;
	if (m/n1 > n2/4) { // dense graphs
		// build complete vector of candidate edges
		pairs = new Array(n1*n2);
		let i = 0;
		for (let u = 1; u <= n1; u++) {
			for (let v = n1+1; v <= n1+n2; v++) {
				pairs[i++] = [u,v];
			}
		}
	} else { // sparse graphs
		// build oversize, but incomplete vector of candidate edges
		pairs = new Array(m + Math.max(m, 200));
		for (let i = 0; i < pairs.length; i++) {
			pairs[i]    = [ randomInteger(1,n1), 0 ];
			pairs[i][1] = randomInteger(n1+1,n1+n2);
		}
		sortReduce(pairs);
		if (pairs.length < m - g.m)
			fatal("Rgraph: program error, too few candidate edges");
	}
	removeDuplicates(pairs, g);
	samplePairs(pairs, g, m);
	g.sortAllEplists();
}

/** Generate a random undirected tree. 
 *  Generates random trees with equal probability assigned to each
 *  labeled tree; method based on Cayley's formula for tree enumeration.
 *  @param numv is the number of vertices in the random tree;
 *  if this object has n()>numv, the tree is generated over the first numv
 *  vertices, leaving the remaining vertices with no edges
 */
export function randomTree(n) {
	// build a random sequence of n-2 vertex numbers
	let nonleaf = new Array(n-1);
	let d = new Array(n+1).fill(1);  // note: intialized to 1, not 0
	for (let i = 1; i <= n-2; i++) {
		nonleaf[i] = randomInteger(1,n);
		d[nonleaf[i]]++;
	}
	// vertices appearing in nonleaf will be non-leaf vertices in the tree
	// number of times a vertex appears in nonleaf is 1 less than its degree
	// d[u] is the degree of u in the tree.
	let degOne = new Dheap(n, 2);      // vertices with one more edge to add
	for (let u = 1; u <= n; u++) {
		if (d[u] == 1) degOne.insert(u, u);
	}
	// construct tree based on Cayley's formula
	let t = new Graph(n, n-1);
	for (let i = 1; i <= n-2; i++) {
		let u = degOne.deletemin();
		let v = nonleaf[i];
		t.join(u, v);
		if (--d[v] == 1) degOne.insert(v, v);
	}
	t.join(degOne.deletemin(), degOne.deletemin());
	t.sortAllEplists();
	return t;
}

/** Create a random simple, connected graph.
 *  @param g is an undirected graph object
 *  @param n is the number of vertices on the graph
 *  @param m is the number of edges
 */
export function randomConnectedGraph(n, m) {
	let g = randomTree(n);
	add2graph(g, m, true);
	return g;
}

/** Create a random simple, regular graph.
 *  @param n is the number of vertices in the graph
 *  @param d is the number of edges incident to each vertex
 *  @param return a random d-regular graph with n vertices,
 *  or n+1 if both n and d are odd; if unable to generate a
 *  graph within the built-in iteration limit, an empty graph
 *  is returned; this becomes more likely to happen when n is
 *  small and/or d>n/3
 */
export function randomRegularGraph(n, d) {
	assert(n > d);
	if ((n & 1) && (d & 1)) n++;

	let m = n*d/2; let g = new Graph(n, m);
	let deg = new Array(n+1).fill(0); // deg[u] = degree of vertex u
	let nabor = new Array(n+1).fill(false);	
		// nabor[v] is true if v is neighbor of "current vertex"

	let totalGap = 0;
	while (totalGap < m || totalGap < 100) {
		let missCount = 0;
		// add edges to graph while not exceeding degree limit
		for (let u = 1; u <= g.n; u++) {
			// mark neighbors of u in nabor array
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
				nabor[g.mate(u, e)] = true;
			// add random edges at u
			while (deg[u] < d && missCount < 2*m) {
				let v = randomInteger(1, n-1);
				if (v >= u) v++;
				if (!nabor[v] && deg[v] < d) {
					g.join(u,v); nabor[v] = true; deg[u]++; deg[v]++;
				} else {
					missCount++;
				}
			}
			// unmark neighbors of u to prepare for next iteration
			for (let e = g.firstAt(u); e != 0; e = g.nextAt(u, e))
				nabor[g.mate(u, e)] = false;
		}
		if (g.m < m) {
			// remove some random edges from full vertices
			// and try again
			let gap = m - g.m; let limit = 5;
			while (g.m > .75*m && g.m > m - (gap+100)) {
				let e = g.randomEdge();
				if (e == 0) break;
				let u = g.left(e); let v = g.right(e);
				if (deg[u] == d && deg[v] == d || --limit == 0) {
					g.delete(e); deg[u]--; deg[v]--; limit = 5;
				}
			}
		}
		if (g.m == m) return g;
		totalGap += m - g.m;
	}
	g.clear(); return g;
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param n1 is the # of vertices in the "left" partition of the bigraph
 *  @param n2 is the # of vertices in the "right" partition
 *  @param noSelf excludes edges of the form (i, n2+i), when true
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1
 *  @param d1 is the degree of the vertices in the "left" partition
 */
function randomRegularBigraph(n1, d1, n2=n1, noSelf=false) {
	assert(n1 > 0 && d1 > 0 && n2 >= d1);
	if ((n1 & 1) && (d1 & 1)) n1++;
	let d2 = Math.ceil(n1*d1/n2);
	let m = d1*n1;	// # of edges
	let dl = new Array(n1+1); let dr = new Array(n2+1);
	let limitl = Math.max(10, Math.min(2*d1, n2));
	let limitr = Math.max(10, Math.min(2*d2, n1));
	let pairs = new Array(Math.min(limitl*n1, limitr*n2));
	let oopsCount = 0; let oopsLimit = 10;
	while (oopsCount < oopsLimit) {
		let plen = 0
		dl.fill(0); dr.fill(0);
		if (n1 < 30 || n2 < 30 || m > n1*n2/3) {
			// build list of all potential edges
			for (let u = 1; u <= n1; u++) {
				for (let v = n1+1; v <= n1+n2; v++) {
					if (noSelf && v == n1+u) continue;
					pairs[plen++] = [u, v]; dl[u]++; dr[v-n1]++;
				}
			}
		} else {
			// sample up to pairs.length edges
			for (let i = 0; i < pairs.length; i++) {
				let u = randomInteger(1, n1);
				let v = n1 + randomInteger(1, n2);
				if (noSelf && v == n1+u) continue;
				if (dl[u] < limitl && dr[v-n1] < limitr) {
					pairs[plen++] = [u, v]; dl[u]++; dr[v-n1]++;
				}
			}
		}
		pairs.length = plen;

		// now, check for parallel edges and eliminate
		pairs.sort((a,b) => (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 :
							(a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0)))));
		let j = 0;
		while (j < plen) {
			let [u,v] = pairs[j];
			if (j > 0 && u == pairs[j-1][0] && v == pairs[j-1][1]) {
				pairs[j] = pairs[--plen];
				if (--dl[u] < d1 || --dr[v-n1] < d2) break;
			}
			j++;
		}
		pairs.length = plen;
		if (j == plen) break;
		oopsCount++;	// rarely exceeds 1
	}
	let g = new Graph(1);
	if (oopsCount == oopsLimit) return g; // empty graph if no good set of pairs
	// Now pairs represents a valid set of edges, so build flowgraph,
	// and use max flow to define edges of random graph
	let fg = new Flograph(n1+n2+2, pairs.length + n1 + n2);
	fg.setSource(n1+n2+1); fg.setSink(n1+n2+2);
	scramble(pairs); // randomize order of edges in pairs
	for (let i = 0; i < pairs.length; i++) {
		let e = fg.join(pairs[i][0], pairs[i][1]);
		fg.setCapacity(e, 1);
	}
	for (let u = 1; u <= n1; u++) {
		let e = fg.join(fg.source, u);
		fg.setCapacity(e, d1);
	}
	let k = n2%d2;
	for (let u = n1+1; u <= n1+n2; u++) {
		let e = fg.join(u, fg.sink);
		fg.setCapacity(e, (u <= n1+k ? d2+1 : d2));
	}
	let f = mflo_dinic(fg);
	g.reset(n1+n2, d1*n1);
	for (let e = fg.first(); e != 0; e = fg.next(e)) {
		let u = fg.tail(e); let v = fg.head(e);
		if (u != fg.source && v != fg.sink && fg.f(u, e) == 1)
			g.join(u, v);
	}
	return g;
}
