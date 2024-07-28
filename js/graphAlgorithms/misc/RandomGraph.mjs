 /** @file RandomGraph.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea} from '../../common/Assert.mjs';
import {randomInteger, range, scramble, randomSample} from
		'../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ListPair from '../../dataStructures/basic/ListPair.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import bimatchF from '../match/bimatchF.mjs';
import matchEG from '../match/matchEG.mjs';

/** Generate an undirected random graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average vertex degree
 *  @return the generated graph
 */  
export function randomGraph(n, d, dmax=n-1) {
	if (d > n-1) d = n-1;
	assert(d <= dmax);
	let m = ~~(d*n/2);
	let g = new Graph(n, m);
	let mm = n*(n-1)/2;
	add2graph(g, m, m > mm/3,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; },
					dmax); 
	return g;
}

/** Generate a random directed graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree
 *  @return the generated graph
 */  
export function randomDigraph(n, d) {
	if (d > n-1) d = n-1;
	let m = ~~(d*n);
	let g = new Digraph(n, m);
	let mm = n*(n-1);
	add2graph(g, m, m > mm/3,
					([u,v]) => (n < 2 || u == n && v == n-1 ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,(v==u-1 ? u : v) + 1] : [u+1,1]))),
					() => { let u = randomInteger(1,n);
						    let v = randomInteger(1,n-1);
							return [u, (v < u ? v : v+1)]; }); 
	return g;
}

/** Generate a random directed acyclic graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree
 *  @return the random graph; note, returned graph has vertices in
 *  topologically sorted order.
 */  
export function randomDag(n, d) {
	if (d > (n-1)/2) d = (n-1)/2;
	let m = ~~(d*n);
	let g = new Digraph(n, m);
	let mm = n*(n-1)/2;
	add2graph(g, m, m > mm/3,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; }); 
	return g;
}

/** Generate a random bipartite graph.
 *  @param ni specifies the number of "input" vertices
 *  @param no specifies the number of "output" vertices
 *  @param id is the average degree of the inputs
 *  @param dmax is optional upper bound on the  vertex degree
 */
export function randomBigraph(ni, id, no=ni, dmax=Math.max(ni,no)-1) {
	ni = Math.max(1,ni); no = Math.max(1,no); id = Math.min(id, no);
	let m = ~~(id*ni);
	let g = new Graph(ni+no, m);
	let mm = ni*no;
	add2graph(g, m, m > mm/3,
					([u,v]) => (u == 0 ? [1, ni+1] :
							   (v < ni+no ? [u, v+1] :
								(u < ni ? [u+1, ni+1] : null))),
					() => [randomInteger(1,ni), randomInteger(ni+1,ni+no)],
					dmax);
	let io = new ListPair(ni+no);
	for (let u = 1; u <= ni; u++) io.swap(u);
	g.setBipartition(io);
	return g;
}

/** Generate a random flograph with one or more "small cuts".
 *  @param n is requested number of vertices
 *  @param d is average out-degree of non-source/sink vertices
 *  @param ssd is out-degree of source and in-degree of sink
 *  @param ncuts is number of small cuts to be placed in graph;
 *  number of edges per cut is constrained to make it highly likely that
 *  the minimum cut occurs at or close to one of these small cuts;
 *  the cuts divide the graph into vertex groups of equal size
 *  @return the computed graph.
 */
export function randomFlograph(n, d, ssd=d, ncuts=1, lookback=1) {
	let p = ncuts+1;  // number of vertex groups
	let q = ~~((n-2)/p); // size of vertex groups (may reduce vertex count) 
	let k = lookback;
	let mc = ~~(.25 * d*ssd/(1+Math.min(k, ssd/q)));
	ea && assert(p>1 && q>1 && 1<d && d*q <= q*(q-1)+mc,
				 `randomFlograph: ${n} ${d} ${ssd} ${ncuts} ${lookback}`);

	n = 2 + p*q; let m = ~~(ssd + d*(n-2));
	let g = new Flograph(n, m);
	g.source = 1; g.sink = g.n;
	g._ssCapScale = 4 * (mc/ssd);

	// add source edges
	let nextm = ssd;
	add2graph(g, nextm, ssd > q/3,
		([u,v]) => u == 0 ? [1,2] : (v < q+1 ? [u,v+1] : null),
		() => [1, randomInteger(2, q+1)]);

	// add sink edges
	nextm += ssd;
	add2graph(g, nextm, ssd > q/3,
		([u,v]) => u == 0 ? [n-q,n] : (u < n-1 ? [u+1,v] : null),
		() => [randomInteger(n-q, n-1), n]);

	// add forward inter-group edges
	for (let i = 0; i < p-1; i++) {
		nextm += mc;
		add2graph(g, nextm, (mc > q*q/3), 
			([u,v]) => u == 0 ? [2+i*q, 2+(i+1)*q] :
								 (v < 1+(i+2)*q ? [u,v+1] :
								  (u < 1+(i+1)*q ? [u+1,2+(i+1)*q] : null)),
			() => [ randomInteger(2+i*q,     1+(i+1)*q),
				    randomInteger(2+(i+1)*q, 1+(i+2)*q) ]);
	}

	// add the remaining edges
	for (let i = 0; i < p; i++) {
		let kk = Math.min(k, i)
		nextm += (i < p-1 ? d*q-mc : d*q-ssd);
		add2graph(g, nextm, d*q > (i*q*q + q*(q-1)/2)/3,
				([u,v]) => {
					if (u == 0)
						return [2+i*q, kk > 0 ? 2+(i-kk)*q : 3+i*q];
					if (v != u-1) 
						return v < 1+(i+1)*q ? [u, v+1] :
											   [u+1, 2+(i-kk)*q];
					else 
						return u < 1+(i+1)*q ? [u, u+1] : null;
				},
				() => { let u = randomInteger(2+i*q, 1+(i+1)*q);
						let v = randomInteger(2+(i-kk)*q, (i+1)*q);
						return [u, v < u ? v : v+1]
				});
	}
	return g;
}

/** Add random edges to yield a random simple graph.
 *  Designed to be useful for a variety of different types of graphs.
 *  For dense graphs, samples from among all possible edges, for
 *  sparse graphs, first generates a sample of random edge candidates,
 *  eliminates duplicates, then selects required number of edges
 *  @param g is a graph
 *  @param m is the target number of edges; if the graph already
 *  has some edges, they are assumed to be unique; additional edges
 *  are added until the graph has m edges
 *  @param nextpair is a function that returns the next pair of vertices
 *  that define an edge, following the pair given as its argument
 *  @param randpair is a function that returns a random pair of vertices
 *  @param dense is a flag which indicates that the graph should be
 *  considered dense
 *  @param dmax is an optional upper bound on the vertex degree
 */
function add2graph(g, m, dense, nextpair, randpair, dmax=g.n-1) {
	if (m <= g.m) return;
	assert(m <= dmax*g.n/2);

	// generate vector of candidate edges to select new edges from
	let pairs = [];
	if (dense) {
		let p = nextpair([0,0]);
		while (p) { pairs.push(p); p = nextpair(p); }
	} else {
		for (let i = 0; i < m + Math.max(200, m); i++)
			pairs.push(randpair());
		sortReduce(pairs);
	}
	removeDuplicates(pairs, g);
	if (pairs.length < m - g.m)
		fatal("Rgraph: program error, too few candidate edges");
	samplePairs(pairs, g, m, dmax);
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

/** Add edges to graph by sampling array of pairs.
 *  @param pairs is an array that identifies candidate edges
 *  @param g is a graph to which edges are to be added
 *  @param m is the number of edges in the final graph
 *  @param dmax is an upper bound on the vertex degree
 *  @return true on success
 */
function samplePairs(pairs, g, m, dmax) {
	let deg = new Int32Array(g.n+1);
	for (let u = 1; u <= g.n; u++) deg[u] = g.degree(u);
	let k = pairs.length - 1;
	while (k >= 0 && g.m < m) {
		let i = randomInteger(0,k);
		let [u,v] = pairs[i];
		if (deg[u] < dmax && deg[v] < dmax) {
			g.join(u,v); deg[u]++; deg[v]++;
		}
		pairs[i] = pairs[k--];
	}
	return g.m == m;
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
	let nonleaf = new Int32Array(n-1);
	let d = new Int32Array(n+1).fill(1);  // note: intialized to 1, not 0
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
 *  @param d is the average vertex degree
 */
export function randomConnectedGraph(n, d) {
	let m = ~~(d*n/2);
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
 *  @param return a random d-regular graph with n vertices
 *  (note, d*n must be even)
 */
export function randomRegularGraph(n, d) {
	// first find a nearly d-regular graph
	assert(!(n&1) || !(d&1));
	let k = 2; let g = randomGraph(n,d,d+k);
	while (g.m != n*d/2) {
		k *= 2; g = randomGraph(n,d,Math.min(n-1,d+k));
	}

	// create lists of vertices with too many and too few neighbors
	let lo = new List(n); let hi = new List(n);
	for (let u = 1; u <= g.n; u++) {
		let du = g.degree(u);
		if (du < d) lo.enq(u);
		else if (du > d) hi.enq(u);
	}
	regularize(g,d,lo,hi);
	return g;
}

/** Helper function for regular graph generators. 
 *  @param g is graph being generated
 *  @param d is target vertex degree
 *  @param lo is a List of vertices with degree <d
 *  @param hi is a List of vertices with degree >d
 */
function regularize(g, d, lo, hi) {
	while (lo.length > 0) {
		let u = lo.first(); let v = hi.first();
		// find a neighbor w of v that is not a neighbor of u,
		// remove {v,w} and add {u,w}
		for (let e = g.firstAt(v); e; e = g.nextAt(v,e)) {
			let w = g.mate(v,e);
			if (w == u || g.findEdge(u,w)) continue;
			g.delete(e);
			g.join(Math.min(u,w),Math.max(u,w));
				// placing smaller vertex on left, ensures that
				// bipartite graphs with inputs first, remain so
			if (g.degree(u) == d) lo.deq();
			if (g.degree(v) == d) hi.deq();
			if (lo.contains(u) && hi.contains(v)) {
				// rotate longer list to ensure different (u,v) pair
				// on next iteration
				if (lo.length > hi.length) {
					lo.enq(lo.deq());
				} else {
					hi.enq(hi.deq());
				}
			}
			break;
		}	
	}
	return g;
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param ni is the # of input (left-side) vertices 
 *  @param id is the degree of the inputs
 *  @param no is the # of output (right-side) vertices
 *  @param return Graph object with inputs 1..ni, outputs ni+1..ni+no
 */
export function randomRegularBigraph(ni, id, no=ni) {
	let od = ni*id/no;
	ea && assert(od == ~~od, 'randomRegularBigraph: out-degree not integer');

	// first find a nearly d-regular graph
	let d = Math.max(id,od);
	let k = 2; let g = randomBigraph(ni,id,no,d+k);
	while (g.m != ni*id) {
		k *= 2; g = randomBigraph(ni,id,no,Math.min(d+k,Math.max(ni-1,no-1)));
	}

	// create lists of inputs with too many or too few neighbors
	let lo = new List(g.n); let hi = new List(g.n);
	for (let u = 1; u <= ni; u++) {
		let du = g.degree(u);
		if (du < id) lo.enq(u);
		else if (du > id) hi.enq(u);
	}
	regularize(g, id, lo, hi);

	// create lists of outputs with too many or too few neighbors
	lo.clear(); hi.clear();
	for (let u = ni+1; u <= ni+no; u++) {
		let du = g.degree(u);
		if (du < od) lo.enq(u);
		else if (du > od) hi.enq(u);
	}
	regularize(g, od, lo, hi);

	return g;
}
