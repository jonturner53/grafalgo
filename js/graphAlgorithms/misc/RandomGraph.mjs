 /** @file RandomGraph.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import {assert, EnableAssert as ea} from '../../common/Assert.mjs';
import {randomInteger, randomDiscrete, range, scramble,
		toCumulative, randomSample} from
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
	assert(d <= dmax && dmax <= n-1 && (n <= 20 || d <= n/2));
	let m = Math.round(d*n/2);
	let g = new Graph(n, m);
	add2graph(g, d, dmax);
	return g;
}

/** Generate a random directed graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree (and average in-degree)
 *  @return the generated graph
 */  
export function randomDigraph(n, d, dmax=n-1) {
	assert(d <= dmax && dmax <= n-1 && (n <= 20 || d <= (n-1)/2),
			d + ' ' + dmax + ' ' + n);
	let m = Math.round(d*n);
	let g = new Digraph(n, m);
	add2graph(g, d, dmax, 0);
	return g;
}

/** Generate a random directed acyclic graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree
 *  @return the random graph; note, returned graph has vertices in
 *  topologically sorted order.
 */  
export function randomDag(n, d, dmax=n-1) {
	assert(d <= dmax && dmax <= n-1 && (n <= 20 || d <= n/4));
	let m = Math.round(d*n);
	assert(m <= (dmax*n - dmax*(dmax+1)/2));

	let g = new Digraph(n, m);
	add2graph(g, d, dmax);
	return g;
}

/** Generate a random bipartite graph.
 *  @param ni specifies the number of "input" vertices
 *  @param no specifies the number of "output" vertices
 *  @param id is the average degree of the inputs
 *  @param dmax is optional upper bound on the  vertex degree
 */
export function randomBigraph(ni, id, no=ni, dmax=Math.max(ni,no)-1) {
	ni = Math.max(1,ni); no = Math.max(1,no); let od = ni*id/no;
	ea && assert((no <= 20 || id <= no/2) && (ni <= 20 || od <= ni/2));
	let m = Math.round(id*ni);
	let g = new Graph(ni+no, m); g.setBipartition(ni);
	add2graph(g, id, dmax); 
	return g;
}

/** Generate a random flograph with a small cut (V1,V2) of roughly
 *  equal size.
 *  @param n is requested number of vertices
 *  @param d is average out-degree of non-source/sink vertices
 *  @param dmax is maximum out-degree of all vertices but source
 *  @return a random flograph with a cut between the first n/2
 *  and the last n/2 vertices that is likely to define a minimum
 *  cut when flow capacities are assigned randomly (capacities
 *  must be assigned separately by the client).
 */
export function randomFlograph(n, d, dmax=n-2) {
	let n1 = Math.floor((n-2)/2); let n2 = Math.ceil((n-2)/2);
	let m = Math.round((n/2) + d*(n-2));

	let g = new Flograph(n, m); g.source = 1; g.sink = g.n;
	g.ssCapScale = d;

	let U = new List(g.n);   U.range(2,n1+1);
	let U2 = new List(g.n); U2.range(n1+2,n-1);
	let SS = new List(g.n);

	// first generate source and sink edges
	let ssn = Math.ceil(n1/2);
	SS.range(1,1);   add2graph(g,ssn,n1,0,SS,U);
	SS.range(n,n); add2graph(g,ssn/n2,ssn,0,U2,SS);

	// now edges within first half and crossing the cut
	add2graph(g,2*d/3,dmax,0,U); add2graph(g,d/3,dmax,0,U,U2);

	// now edges within second half and crossing the reverse cut
	add2graph(g,2*d/3,dmax,0,U2); add2graph(g,d/3,dmax,0,U2,U);

	return g;
}

/** Add edges to a graph (or subgraph).
 *  @param g is a graph.
 *  @param d is an integer specifying the average degree (details below)
 *  @param dmax is an upper bound on the degree of the returned graph
 *	@param rising is a boolean; when true, the index of the second vertex
 *  of every generated edge is larger than that of the first vertex;
 *  it defaults to true
 *  @param U is an optional List defining a subset of the vertices of g;
 *  its value defaults to the full vertex set if g has no bipartition and
 *  to the set of inputs if g does
 *  @param U2 is a List defining a second subset of vertices; it defaults
 *  to U if g has no biparititon and to the set of outputs if g does
 *  @return on return, g is a random graph that extends the original value
 *  using edges from U to U2, where the average degree (or out-degree for
 *  digraphs) in the subgraph induced by U and U2 is d and the maximum degree
 *  of g is d; may fail to generate enough edges if dmax constraint
 *  is too tight
 */
export function add2graph(g, d, dmax=g.n-1, rising=1, U=0, U2=0) {
	let [mm, pairs] = createPairs(g, d, rising, U, U2);
	reduce(g, pairs);		// removes duplicates from within pairs
	removeDuplicates(g, pairs);  // removes pairs that are in g

	ea && assert(pairs.length >= mm,
				 'add2graph: program error, too few candidate edges');

	let success = samplePairs(g, mm, pairs, dmax);
	g.sortAllEplists();
	return success;
}

/* Create array of vertex pairs that can be used for edges.
 * @param g is a pre-existing graph
 * @param d is target average degree for vertices in graph or, if U is defined,
 * the average degree of the subgraph on U
 * @param U is an optional List defining a subset of the vertices
 * @param return [m, pairs] where m is the total number of edges that must be
 * added to reach the target average degree and pairs is an Array of
 * vertex pairs.
 */
function createPairs(g, d, rising=1, U=0, U2=0) {
	let digraph = (g instanceof Digraph);
	if (!U) {
		U = new List(g.n);
		if (g.hasBipartition) {
			for (let u = g.firstInput(); u; u = g.nextInput(u)) U.enq(u);
		} else {
			for (let u = 1; u <= g.n; u++) U.enq(u);
		}
	}
	if (!U2) {
		U2 = new List(g.n);
		if (g.hasBipartition) {
			for (let u = g.firstOutput(); u; u = g.nextOutput(u)) U2.enq(u);
		} else {
			U2 = U;
		}
	}

	ea && assert(d <= U2.length);

	// create discrete distribution on U for generating vertex pairs
	let [mu, sv, sv2] = samplingVectors(g, U, U2);

	// determine number of edges required to get desired avg degree
	let mm = Math.round(d*U.length);
	if (!digraph && U2 == U) mm /= 2;
	ea && assert(mu <= mm);

	// and number of pairs to be confident that sampling will yield mm edges
	let mp = mm-mu; mp += Math.max(mp, 100);

	let pairs = new Array();
	while (mp > 0) {
		let u =  sv[1][randomDiscrete(sv[0])];
		let v = sv2[1][randomDiscrete(sv2[0])];
		if (u == v || (rising && v<u)) continue;
		pairs.push([u,v]); mp--;
	}

	return [mm,pairs];
}

/** Compute sampling vector for a graph or subgraph
 *  @param g is a graph
 *  @param U is a List of vertices in g
 *  @param U2 is a disjoint List of vertices (or possibly an alias for U)
 *  @return pair [mU, sv, sv2] where mU is the number of edges in g joining
 *  vertices in U to vertices in U2 and sv is a pair of arrays: sv[0][i] is
 *  the probability for selecting one of the first i vertices in U
 *  and sv[1][i] is the i-th vertex in U; sv2 is defined similarly wrt U2
 */
function samplingVectors(g, U=0, U2=0) {
	let digraph = (g instanceof Digraph);
	// compute sampling vector for U1
	let sv = [new Float32Array(U.length+1), new Int32Array(U.length+1)];
	let psum = 0; let mU = 0; let i = 1;
	for (let u = U.first(); u; u = U.next(u)) {
		let deg = (digraph ? outDegree(g,u,U2) : degree(g,u,U2));
		sv[0][i] = 1/(1+deg); psum += sv[0][i]; mU += deg;
		sv[1][i] = u; i++;
	}
	if (!digraph && U2 == U) mU /= 2;
	for (let i = 1; i <= U.length; i++) sv[0][i] /= psum;
	sv[0] = toCumulative(sv[0]);
	if (!digraph && U2 == U) return [mU, sv, sv];

	// repeat for U2
	let sv2 = [new Float32Array(U2.length+1), new Int32Array(U2.length+1)];
	psum = 0; i = 1;
	for (let u = U2.first(); u; u = U2.next(u)) {
		let deg = (digraph ? inDegree(g,u,U) : degree(g,u,U));
		sv2[0][i] = 1/(1+deg); psum += sv2[0][i];
		sv2[1][i] = u; i++;
	}
	for (let i = 1; i <= U2.length; i++) sv2[0][i] /= psum;
	sv2[0] = toCumulative(sv2[0]);

	return [mU, sv, sv2];
}

/** Compute the degree of a vertex relative to a subset.  */
function degree(g, u, V) {
	let deg = 0;
	for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
		if (V.contains(g.mate(u, e))) deg++;
	return deg;
}

/** Compute the in-degree of a vertex relative to a subset.  */
function inDegree(g, u, V) {
	let deg = 0;
	for (let e = g.firstInto(u); e; e = g.nextInto(u,e))
		if (V.contains(g.tail(e))) deg++;
	return deg;
}

/** Compute the out-degree of a vertex relative to a subset.  */
function outDegree(g, u, V) {
	let deg = 0;
	for (let e = g.firstOutof(u); e; e = g.nextOutof(u,e))
		if (V.contains(g.head(e))) deg++;
	return deg;
}

/** Sort vector of pairs and remove duplicates */
function reduce(g, pairs) {
	let digraph = (g instanceof Digraph);
	if (digraph)
		pairs.sort((a,b) => (a[0] != b[0] ? a[0]-b[0] : a[1]-b[1]));
	else
		pairs.sort((a,b) => {
								let ma = Math.min(a[0],a[1]);
								let Ma = Math.max(a[0],a[1]);
								let mb = Math.min(b[0],b[1]);
								let Mb = Math.max(b[0],b[1]);
								return (ma != mb ?  ma-mb : Ma-Mb); 
							});
	let i = 0; let j = 1;
	while (j < pairs.length) {
		if (digraph) {
			if (pairs[j][0] != pairs[i][0] || pairs[j][1] != pairs[i][1])
				pairs[++i] = pairs[j];
		} else {
			let mi = Math.min(pairs[i][0],pairs[i][1]);
			let Mi = Math.max(pairs[i][0],pairs[i][1]);
			let mj = Math.min(pairs[j][0],pairs[j][1]);
			let Mj = Math.max(pairs[j][0],pairs[j][1]);
			if (mi != mj || Mi != Mj) pairs[++i] = pairs[j];
		}
		j++;
	}
	pairs.length = i+1;
	if (!digraph) // re-order by first vertex
		pairs.sort((a,b) => (a[0] != b[0] ? a[0]-b[0] : a[1]-b[1]));
}

/** Remove pairs that already appear as edges in g.
 *  Pairs assumed to be sorted.
 */
function removeDuplicates(g, pairs) {
	let digraph = (g instanceof Digraph);
	let i = 0; let nabors = new List(g.n);
	for (let u = 1; u <= g.n && i < pairs.length; u++) {
		if (u < pairs[i][0]) continue;
		// build list of u's neighbors
		nabors.clear();
		for (let e = g.firstAt(u); e; e = g.nextAt(u,e)) {
			if (!digraph || u == g.tail(e))
				nabors.enq(g.mate(u,e));
		}
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
		else pairs[i++] = pairs[j++];
	}
	pairs.length = i;
}

/** Add edges to graph by sampling array of pairs.
 *  @param pairs is an array that identifies candidate edges
 *  @param g is a graph to which edges are to be added
 *  @param mm is the number of edges to be added
 *  @param dmax is upper bound on the degree of any vertex
 *  @return true on success
 */
function samplePairs(g, mm, pairs, dmax) {
	let digraph = (g instanceof Digraph);
	let deg; let odeg; let ideg;
	if (digraph) {
		ideg = new Int32Array(g.n+1); odeg = new Int32Array(g.n+1);
		for (let u = 1; u <= g.n; u++) {
			ideg[u] = g.inDegree(u); odeg[u] = g.outDegree(u);
		}
	} else {
		deg = new Int32Array(g.n+1);
		for (let u = 1; u <= g.n; u++) deg[u] = g.degree(u);
	}
	let k = pairs.length - 1;
	while (k >= 0 && mm) {
		let i = randomInteger(0,k);
		let [u,v] = pairs[i];
		if (digraph) {
			if (odeg[u] < dmax && ideg[v] < dmax) {
				g.join(u,v); odeg[u]++; ideg[v]++; mm--;
			}
		} else {
			if (deg[u] < dmax && deg[v] < dmax) {
				g.join(u,v); deg[u]++; deg[v]++; mm--;
			}
		}
		pairs[i] = pairs[k--];
	}
	return mm == 0;
}

/** Generate a random undirected tree. 
 *  Generates random trees with equal probability assigned to each
 *  labeled tree; method based on Cayley's formula for tree enumeration.
 *  @param n is the number of vertices in the random tree
 *  @param dmax is the maximum vertex degree in resulting tree
 */
export function randomTree(n, dmax=n-1) {
	// build a random sequence of n-2 vertex numbers
	let nonleaf = new Int32Array(n-1);
	let d = new Int32Array(n+1).fill(1);  // note: intialized to 1, not 0
	for (let i = 1; i <= n-2; i++) {
		let u; do { u = randomInteger(1,n); } while (d[u] >= dmax);
		nonleaf[i] = u; d[u]++;
	}
	// vertices appearing in nonleaf will be non-leaf vertices in the tree
	// number of times a vertex appears in nonleaf is 1 less than its degree
	// d[u] is the target degree of u in the tree
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
might want to use this method only when d is small enough
to make it likely that a random graph is not connected
 */
export function randomConnectedGraph(n, d, dmax=n-1) {
	let g = randomTree(n, dmax);
	add2graph(g, d, dmax);
	return g;
}

/** Create a random simple, regular graph.
 *  @param n is the number of vertices in the graph
 *  @param d is the number of edges incident to each vertex;
 *  if d is not an integer, degrees differ from d by <1
 *  @param return a random d-regular graph with n vertices
 *  (note, d*n must be even)
 */
export function randomRegularGraph(n, d) {
	// first find a nearly d-regular graph
	let k = 2; let g = randomGraph(n,d,d+k);
	while (g.m != n*d/2) {
		k *= 2; g = randomGraph(n,d,Math.min(n-1,d+k));
	}
	// now regularize by shifting edges from vertices with too many
	// to those with too few
	let W = new List(g.n); W.range(1,g.n);
	regularize(g,d,W);
	return g;
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param ni is the # of input (left-side) vertices 
 *  @param id is the degree of the inputs; if id (or implied od)
 *  is not an integer, degrees differ from target by less than 1
 *  @param no is the # of output (right-side) vertices
 *  @param return Graph object with inputs 1..ni, outputs ni+1..ni+no
 */
export function randomRegularBigraph(ni, id, no=ni) {
	let od = ni*id/no;

	// first find a nearly d-regular graph
	let d = Math.max(id,od);
	let k = 2; let g = randomBigraph(ni,id,no,d+k);
	while (g.m != ni*id) {
		k *= 2; g = randomBigraph(ni,id,no,d+k);
	}

	let W = new List(g.n);
	W.range(1,ni);     regularize(g,id,W);
	W.range(ni+1,g.n); regularize(g,od,W);

	return g;
}

/** Helper function for regular graph generators. 
 *  @param g is graph being generated
 *  @param d is target vertex degree (need not be an integer)
 *  @param W is a subset of vertices to be regularized; the degrees
 *  of the vertices in W are in open interval (d-1,d+1) on return;
 *  note: the average degrees of vertices in W is assumed to be d initially
 */
export function regularize(g, d, W) {
	let lo = new List(g.n); let under = new List(g.n);
	let hi = new List(g.n); let over = new List(g.n);

	for (let u = W.first(); u; u = W.next(u)) {
		let du = g.degree(u);
		if (du <= d-1) lo.enq(u);		// vertices in lo require more edges
		else if (du < d) under.enq(u);	// those in under can accept one more
		else if (du >= d+1) hi.enq(u);	// those in hi must lose edges
		else if (du > d) over.enq(u);	// those in over can give up one
	}
	while (!lo.empty() || !hi.empty()) {
		let u = (!lo.empty() ? lo.first() : under.first());
		let v = (!hi.empty() ? hi.first() :  over.first());
		// find a neighbor w of v that is not a neighbor of u,
		// remove {v,w} and add {u,w}
		for (let e = g.firstAt(v); e; e = g.nextAt(v,e)) {
			let w = g.mate(v,e);
			if (w == u || g.findEdge(u,w)) continue;
			g.delete(e);
			g.join(Math.min(u,w),Math.max(u,w));
				// placing smaller vertex on left, ensures that
				// bipartite graphs with inputs first, remain so
			break;
		}
		if (under.contains(u)) under.deq();
		else if (g.degree(u) > d-1) {
			lo.deq(); if (g.degree(u) < d) under.enq(u);
		}
		if (over.contains(v)) over.deq();
		else if (g.degree(v) < d+1) {
			hi.deq(); if (g.degree(v) > d) over.enq(v);
		}
		if (lo.contains(u) && hi.contains(v)) {
			// rotate longer list to ensure different (u,v) pair
			// on next iteration of outer loop
			if (lo.length > hi.length) {
				lo.enq(lo.deq());
			} else {
				hi.enq(hi.deq());
			}
		}
	}
}
