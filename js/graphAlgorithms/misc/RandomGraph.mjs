 /** @file RandomGraph.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, fatal } from '../../common/Errors.mjs';
import { randomInteger, scramble } from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';

/*
How to generalize edge generation?
Suppose we pass a function that generates a random edge that is
acceptable by a user-defined standard.

Then main routine can use this to generate random pairs and
eliminate parallel edges.

If the graph is dense, user supplied function could be list of all pairs.
Maybe just generate list of pairs in all cases.

Another issue is that we ignore existing edges when generating new ones.
Maybe we should be using a set with constant time membership test
from the start. Probably need dedicated HashSet to do this right.

1. create a pair set from existing edges
2. create a set of candidate pairs that excludes the current edges
3. sample from candidate pairs and add to graph
1 and 3 are generic, 2 must be specialized.
general form
- if lots of edges needed, generate all possible
- otherwise, generate random set with some surplus

can we make 2 mostly generic too? say using a random edge generator?
- generate random non-duplicates, so long as not too many are being
  discarded; if we get enough that way, we're done
- else fill gaps, using sampling routine that gives next edge
  following a given one

Two methods
- one to return random pair
- one to return next pair, given current one
- and maybe a predicate that tells if # of target edges is too high to sample


So main driver becomes
- if dense graph
	- get all pairs
- else sample pairs, sort list and remove duplicates
- remove pairs found in g
- sample pairs list add to g

for undirected graphs
- next edge is {a,b} => {a,b+1} or {a+1,a+2}
- sample is randomly select two endpoints


					
	
*/

/** Generate an undirected random graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
export function randomGraph(n, m) {
	let g = new Graph(n, m);
	add2graph(g, m, true);
	return g;
}
 */  
export function randomGraph(n, m) {
	let g = new Graph(n, m);
	let mm = n*(n-1)/2;
	m = Math.min(m, mm);
	add2graph(g, m, m > mm/2,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; }); 
	return g;
}

/** Generate a random directed graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
export function randomDigraph(n, m) {
	let g = new Digraph(n, m);
	add2graph(g, m, false);
	return g;
}
 */  
export function randomDigraph(n, m) {
	let g = new Digraph(n, m);
	let mm = n*(n-1);
	m = Math.min(m, mm);
	add2graph(g, m, m > mm/2,
					([u,v]) => (n < 2 || u == n && v == n-1 ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,(v == u-1 ? u : v) + 1] : [u+1,1]))),
					() => { let u = randomInteger(1,n);
						    let v = randomInteger(1,n-1);
							return [u, (v < u ? v : v+1)]; }); 
	return g;
}

/** Generate a random directed acyclic graph. 
 *  @param n is the number of vertices in the random graph
 *  @param m is the number of edges in the graph
 *  @return the random graph; note, returned graph has vertices in
 *  topologically sorted order.
export function randomDag(n, m) {
	let g = new Digraph(n, m);
	add2graph(g, m, true);
	return g;
}
 */  
export function randomDag(n, m) {
	let g = new Digraph(n, m);
	let mm = n*(n-1)/2;
	m = Math.min(m, mm);
	add2graph(g, m, m > mm/2,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; }); 
	return g;
}

/** Generate a random flograph.
 *  @param p is number of levels
 *  @param q is size of levels
 *  @param k is how max # of levels edges can go back
 *  @return a flograph with 2+p*q vertices and m edges, where the
 *  non-source/sink are divided into p groups of q vertices and edges
 *  from level i, may go to vertices in levels i-k up to i+1.
 */
export function randomFlograph(p, q, k, m) {
	assert(p>1 && q>1);
	let n = 2 + p*q;
	let mm = 2*q + (p-1 + k*(p-k) + (k*(k-1)/2))*q*q + p*q*(q-1);
	m = Math.min(m, mm);
	let g = new Flograph(n, m);
	// setup source/sink edges
	g.setSource(1); g.setSink(n);
	for (let i = 1; i <= q; i++) {
		let e;
		e = g.join(g.source, g.source+i); g.setCapacity(e, Infinity);
		e = g.join(g.sink-i, g.sink); 	  g.setCapacity(e, Infinity);
	}
	// add more edges
	add2graph(g, m, m > mm/2,
					([u,v]) => {
						let i = Math.floor((u-2)/q);
						let j = Math.floor((v-2)/q);
						let r = Math.floor((u-2)%q);
						let s = Math.floor((v-2)%q);
						if (u == 0) return [2,3];
						if (v != u-1 && (s<q-1 || j<=i && j<p-1))
							return [u,v+1];
						if (v == u-1)
							return (u == n-1 ? null : [u,u+1]);
						return (r < q-1 ? [u+1,2+Math.max(0,(i-k)*q)] :
										  [u+1,2+Math.max(0,((i+1)-k)*q)]);
					},
					() => { let u = randomInteger(2,n-1);
							let i = Math.floor((u-2)/q);
							let r = Math.floor((u-2)%q);
							let v = randomInteger(2+Math.max(0, (i-k)*q),
												  2+Math.min(n-1, (i+1)*q-1));
							return [u, v < u ? v : v+1]});
	return g;
}

/** Add random edges to yield a random simple graph.
 *  @param g is a graph
 *  @param m is the target number of edges; if the graph already
 *  has some edges, they are assumed to be unique; additional edges
 *  are added until the graph has m edges
 *  @param up is a flag; if true, add edges [u,v] with u<v;
 *  if false pairs are not constrained
function add2graph(g, m, up=false) {
	if (m <= g.m) return;
	assert(m <= (up ? g.n*(g.n-1)/2 : g.n*g.n-1),
		   'RandomGraph.addEdges: too many edges')

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
			let u, v;
			if (up) {
				u = randomInteger(1, g.n-1);
				v = randomInteger(u+1, g.n);
			} else {
				u = randomInteger(1, g.n);
				v = randomInteger(1, g.n-1);
				if (v >= u) v++;
			}
			pairs[i] = [u,v];
		}
		sortReduce(pairs);
	}
	removeDuplicates(pairs, g);
	if (pairs.length < m - g.m)
		fatal("Rgraph: program error, too few candidate edges");
	samplePairs(pairs, g, m);
	g.sortAllEplists();
}
 */
function add2graph(g, m, dense, nextpair, randpair) {
	if (m <= g.m) return;

	// generate vector of candidate edges to select new edges from
	let pairs = [];
	if (dense) {
		let p = nextpair([0,0]);
		while (p) { pairs.push(p); p = nextpair(p); }
	} else {
		pairs = new Array(m + Math.max(200, m));
		for (let i = 0; i < pairs.length; i++)
			pairs[i] = randpair();
		sortReduce(pairs);
	}
	removeDuplicates(pairs, g);
	if (pairs.length < m - g.m)
		fatal("Rgraph: program error, too few candidate edges");
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
	let degOne = new ArrayHeap(n, 2);      // vertices with one more edge to add
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
	add2graph(g, m, m > n*n/4,
					([a,b]) => (n < 2 || a == n-1 && b == n ? null :
						    	(a == 0 ? [1,2] :
								 (b < n ? [a,b+1] : [a+1,a+2]))),
					() => { let a = randomInteger(1,n-1);
							return [a, randomInteger(a+1, n)]; }); 
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
	let pairs = new Array(1 + Math.min(limitl*n1, limitr*n2));
	let oopsCount = 0; let oopsLimit = 10;
	while (oopsCount < oopsLimit) {
		let nextPair = 1;
		dl.fill(0); dr.fill(0);
		if (n1 < 30 || n2 < 30 || m > n1*n2/3) {
			// build list of all potential edges
			for (let u = 1; u <= n1; u++) {
				for (let v = n1+1; v <= n1+n2; v++) {
					if (noSelf && v == n1+u) continue;
					pairs[nextPair++] = [u, v]; dl[u]++; dr[v-n1]++;
				}
			}
		} else {
			// sample up to pairs.length edges
			for (let i = 0; i < pairs.length; i++) {
				let u = randomInteger(1, n1);
				let v = n1 + randomInteger(1, n2);
				if (noSelf && v == n1+u) continue;
				if (dl[u] < limitl && dr[v-n1] < limitr) {
					pairs[nextPair++] = [u, v]; dl[u]++; dr[v-n1]++;
				}
			}
		}
		pairs.length = nextPair;

		// now, check for parallel edges and eliminate
		pairs.sort((a,b) => (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 :
							(a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0)))));
		let j = 0;
		while (j < nextPair) {
			let [u,v] = pairs[j];
			if (j > 0 && u == pairs[j-1][0] && v == pairs[j-1][1]) {
				pairs[j] = pairs[--nextPair];
				if (--dl[u] < d1 || --dr[v-n1] < d2) break;
			}
			j++;
		}
		pairs.length = nextPair;
		if (j == nextPair) break;
		oopsCount++;	// rarely exceeds 1
	}
	let g = new Graph(1);
	if (oopsCount == oopsLimit) return g; // empty graph if no good set of pairs
	// Now pairs represents a valid set of edges, so build flowgraph,
	// and use max flow to define edges of random graph
	let fg = new Flograph(n1+n2+2, pairs.length + n1 + n2);
	fg.setSource(n1+n2+1); fg.setSink(n1+n2+2);
	scramble(pairs); // randomize order of edges in pairs
	for (let i = 1; i < pairs.length; i++) {
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
	let f = maxflowD(fg);
	g.reset(n1+n2, d1*n1);
	for (let e = fg.first(); e != 0; e = fg.next(e)) {
		let u = fg.tail(e); let v = fg.head(e);
		if (u != fg.source && v != fg.sink && fg.f(u, e) == 1)
			g.join(u, v);
	}
	return g;
}
