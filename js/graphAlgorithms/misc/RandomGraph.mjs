 /** @file RandomGraph.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, assertEnabled as ae } from '../../common/Assert.mjs';
import {randomInteger, randomDiscrete, range, scramble,
		toCumulative, randomSample, randomPermutation} from
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
	ae() && assert(d <= dmax && dmax <= n-1 && (n <= 20 || d <= n/2));
	if (typeof dmax == 'number') dmax = [dmax,dmax];
	let m = Math.round(d*n/2);
	let g = new Graph(n, m); add2graph(g, d, dmax);
	return g;
}

/** Generate a random bipartite graph.
 *  @param ni specifies the number of "input" vertices
 *  @param no specifies the number of "output" vertices
 *  @param id is the average degree of the inputs
 *  @param dmax is an optional pair [idmax,odmax] where idmax is an upper
 *  bound on the degree of inputs and odmax is an upper bound on the degree of
 *  outputs; when idmax=odmax, one can use a single integer rather than a pair.
 */
export function randomBigraph(ni, id, no=ni, dmax=[no,ni]) {
	if (typeof dmax == 'number') dmax = [dmax,dmax];
	ni = Math.max(1,ni); no = Math.max(1,no); let od = ni*id/no;
	ae() && assert((no <= 20 || id <= no/2) && (ni <= 20 || od <= ni/2));
	let m = Math.round(id*ni);
	let g = new Graph(ni+no, m); g.setBipartition(ni);
	let  inputs = new List(g.n);  inputs.range(1,ni);
	let outputs = new List(g.n); outputs.range(ni+1,g.n);
	add2graph(g, id, dmax, inputs, outputs); 
	return g;
}

/** Generate a random directed graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree (and average in-degree)
 *  @param dmax is an optional upper bound on the vertex degree;
 *  if specified as a pair, the first constrains the out-degrees
 *  while the second constrains the input degrees
 *  @return the generated graph
 */  
export function randomDigraph(n, d, dmax=n-1) {
	if (typeof dmax == 'number') dmax = [dmax,dmax];
	ae() && assert(d <= dmax[0] && d <= dmax[1] & dmax[0] <= n-1 &&
				 dmax[1] <= n-1 && (n <= 20 || d <= (n-1)/2),
				n +' '+ d +' '+ dmax);
	let m = Math.round(d*n);
	let g = new Digraph(n, m);
	let vertices = new List(g.n); vertices.range(1,n);
	add2graph(g, d, dmax, vertices, vertices, 0);
	return g;
}

/** Generate a random directed acyclic graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average out-degree
 *  @return the random graph; note, returned graph has vertices in
 *  topologically sorted order.
 */  
export function randomDag(n, d, dmax=n-1) {
	ae() && assert(d <= dmax && dmax <= n-1 && (n <= 20 || d <= n/4),
				   n+' '+d+' '+dmax);
	let m = Math.round(d*n);
	ae() && assert(m <= (dmax*n - dmax*(dmax+1)/2));
	if (typeof dmax == 'number') dmax = [dmax,dmax];

	let g = new Digraph(n, m);
	let vertices = new List(g.n); vertices.range(1,n);
	add2graph(g, d, dmax, vertices, vertices);
	return g;
}

/** Generate a random flograph with a small cut.
 *  The non-source/sink vertices are divided into a left subset and
 *  a right subset of equal size.
 *  @param n is specified number of vertices
 *  @param d is average out-degree (and in-degree) of the subgraph on
 *  the left/right vertices.
 *  @param dmax is the maximum out-degree of the left/right subgraph
 *  or a pair where the second value specifies the maximum in-degree.
 *  @return a random flograph with a relatively small cut between
 *  the left and right subsets. When flow capacities are assigned
 *  randomly with a scaling factor of d (see randomCapacities method),
 *  the minimum cut is likely to be close to this built-in cut.
 */
export function randomFlograph(n, d, dmax=n-2) {
	if (typeof dmax == 'number') dmax = [dmax,dmax];
	let n1 = Math.floor((n-2)/2); let n2 = n - (n1 + 2);
	let m = Math.round((n/2) + d*(n-2));

	let g = new Flograph(n, m); g.source = 1; g.sink = g.n;

	let U1 = new List(g.n); U1.range(2,n1+1);
	let U2 = new List(g.n); U2.range(n1+2,n-1);
	let SS = new List(g.n);

	// first generate source and sink edges
	let ssn = Math.ceil(n1/2);
	SS.range(1,1);   add2graph(g,ssn, [ssn,1],SS,U1);
	SS.range(n,n); add2graph(g,ssn/n2,[1,ssn],U2,SS);

	// now edges within first half and crossing the cut
	let d1 = Math.min(dmax[0],n1); let d2 = Math.min(dmax[1],n2);
	add2graph(g,2*d/3,[d1,d1],U1,U1,0); add2graph(g,d/3,[d1,d2],U1,U2,0);

	// now edges within second half and crossing the reverse cut
	add2graph(g,2*d/3,[d2,d2],U2,U2,0); add2graph(g,d/3,[d2,d1],U2,U1,0);

	return g;
}

/** Add edges to a graph (or subgraph).
 *  @param g is a graph.
 *  @param d is an integer specifying the average number of additional
 *  edges added to each vertex (details below)
 *  @param dmax is an upper bound on the degree of the returned graph;
 *  optionally, it may be defined as a pair; in this case, the first bound
 *  is applied to the first vertex of each generated edge, and the second
 *  is applied to the second vertex; this can be useful if the graph is
 *  bipartite or a digraph; a bound of zero is interpreted as no-restriction
 *  @param rising is a boolean; when true, the index of the second vertex
 *  of every generated edge is larger than that of the first vertex;
 *  it defaults to true
 *  @param U1 is an optional List defining a subset of the vertices of g;
 *  its value defaults to the full vertex set if g has no bipartition and
 *  to the set of inputs if g does
 *  @param U2 is a List defining a second subset of vertices; it defaults
 *  to U if g has no bipartition and to the set of outputs if g does
 *  @return on return, g is a random simple graph that extends the original
 *  graph using edges from U1 to U2, where the average degree (or out-degree for
 *  digraphs) in the subgraph induced by U1 and U2 is d and the maximum degree
 *  of g is dmax; may fail to generate enough edges if dmax constraint
 *  is too tight
 */
export function add2graph(g, d, dmax=g.n, U1, U2=U1, rising=1) {
	if (typeof dmax == 'number') dmax = [dmax,dmax];
	if (!U1) {
		U1 = new List(g.n); U1.range(1,g.n); U2 = U1;
	}
		
	let [mm, pairs] = createPairs(g, d, U1, U2, rising);
		// mm is number of edges to be added to g
	reduce(g, pairs);			 // removes duplicates from within pairs
	removeDuplicates(g, pairs);  // removes pairs that are in g

	ae() && assert(pairs.length >= mm,
				   'add2graph: program error, too few candidate edges');

	let success = samplePairs(g, mm, pairs, dmax);
		// randomly sample mm pairs, limiting degrees according to dmax
	g.sortAllEplists();
	return success;
}

/* Create array of vertex pairs that can be used for edges.
 * @param g is a pre-existing graph
 * @param d is target average degree for vertices in graph or, if U1 is defined,
 * the average degree of the subgraph on U1
 * @param U1 is an optional List defining a subset of the vertices
 * @param U2 is a a second subset of the vertices; if present, only edges
 * with one endpoint in U1 and the other in U2 are generated; for digraphs,
 * the generated edges are directed from U1 to U2
 * @param return [m, pairs] where m is the total number of edges that must be
 * added to reach the target average degree and pairs is an Array of
 * vertex pairs.
 */
function createPairs(g, d, U1, U2, rising) {
	let digraph = (g.constructor.name == 'Digraph');

	ae() && assert(d <= U2.length);

	// create discrete distribution on U1 for generating vertex pairs
	let [mU1, sv, sv2] = samplingVectors(g, U1, U2);
		// mU1 is number of edges already in g from U1 to U2

	// determine total number of edges needed for desired avg degree
	let mn = Math.round((digraph || U2 != U1 ) ? d*U1.length : d*U1.length/2);
	ae() && assert(mU1 <= mn);

	// and number of pairs to be confident that sampling will yield mn edges
	let mp = mn-mU1; mp += Math.max(mp, 100);

	let pairs = new Array(); let missCount = 0;
	while (mp > 0) {
		ae() && assert(missCount < 100, 'unable to generate enough random pairs');
		let u =  sv[1][randomDiscrete(sv[0])];
		let v = sv2[1][randomDiscrete(sv2[0])];
		if (u == v || (rising && v<u)) { missCount++; continue; }
		pairs.push([u,v]); mp--; missCount = 0;
	}

	return [mn-mU1,pairs];
}

/** Compute sampling vector for a graph or subgraph
 *  @param g is a graph
 *  @param U1 is a List of vertices in g
 *  @param U2 is a disjoint List of vertices (or possibly an alias for U1)
 *  @return pair [mU1, sv, sv2] where mU1 is the number of edges in g joining
 *  vertices in U1 to vertices in U2 and sv is a pair of arrays: sv[0][i] is
 *  the probability for selecting one of the first i vertices in U1
 *  and sv[1][i] is the i-th vertex in U1; sv2 is defined similarly wrt U2
 */
function samplingVectors(g, U1, U2) {
	let digraph = (g.constructor.name == 'Digraph');
	// compute sampling vector for U1
	let sv = [new Float32Array(U1.length+1), new Int32Array(U1.length+1)];
	let psum = 0; let mU1 = 0; let i = 1;
	for (let u = U1.first(); u; u = U1.next(u)) {
		let deg = (digraph ? outDegree(g,u,U2) : degree(g,u,U2));
		sv[0][i] = 1/(1+deg); psum += sv[0][i]; mU1 += deg;
		sv[1][i] = u; i++;
	}
	if (!digraph && U2 == U1) mU1 /= 2;
	for (let i = 1; i <= U1.length; i++) sv[0][i] /= psum;
	sv[0] = toCumulative(sv[0]);
	if (!digraph && U2 == U1) return [mU1, sv, sv];

	// repeat for U2
	let sv2 = [new Float32Array(U2.length+1), new Int32Array(U2.length+1)];
	psum = 0; i = 1;
	for (let u = U2.first(); u; u = U2.next(u)) {
		let deg = (digraph ? inDegree(g,u,U1) : degree(g,u,U1));
		sv2[0][i] = 1/(1+deg); psum += sv2[0][i];
		sv2[1][i] = u; i++;
	}
	for (let i = 1; i <= U2.length; i++) sv2[0][i] /= psum;
	sv2[0] = toCumulative(sv2[0]);

	return [mU1, sv, sv2];
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
	let digraph = (g.constructor.name == 'Digraph');
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
	let digraph = (g.constructor.name == 'Digraph');
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
 *  @param dmax is a pair [d1,d2] where d1 bounds the degree of the
 *  the first vertex of any sampled pair and d2 bounds the second;
 *  for digraphs, d1 bounds the out-degree of the first vertex and
 *  d2 bounds the in-degree of the second
 *  @return true on success
 */
function samplePairs(g, mm, pairs, dmax) {
	let digraph = (g.constructor.name == 'Digraph');
	let bipartite = g.hasBipartition;
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
	let [d1,d2] = dmax;
	while (k >= 0 && mm) {
		let i = randomInteger(0,k);
		let [u,v] = pairs[i];
		if (digraph && odeg[u] < d1 && ideg[v] < d2) {
			g.join(u,v); odeg[u]++; ideg[v]++; mm--;
		}
		if (!digraph && deg[u] < d1 && deg[v] < d2) {
			g.join(u,v); deg[u]++; deg[v]++; mm--;
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
	let t = randomTree(n, dmax);
	let g = new Graph(n, Math.ceil(n*d/2));
	for (let e = t.first(); e; e = t.next(e))
		g.join(t.left(e), t.right(e));
	dmax = [dmax,dmax]; add2graph(g, d, dmax);
	return g;
}

/** Create a random simple, regular graph.
 *  @param n is the number of vertices in the graph
 *  @param d is the number of edges incident to each vertex;
 *  if d is not an integer, degrees differ from d by <1
 *  @param reg is an integer that controls how regular the graph is;
 *  specifically, the degree must differ from d by less than reg
 *  @param return a random d-regular graph with n vertices
 *  (note, d*n must be even)
 */
export function randomRegularGraph(n, d, reg=1) {
	// first find a nearly d-regular graph
	let k = 1; let g = randomGraph(n,d,d+reg+k);
	while (g.m != n*d/2) { // typically, 1 or 2 attempts is enough
		k *= 2; g = randomGraph(n,d,d+reg+k);
	}
	// now regularize by shifting edges from vertices with too many
	// to those with too few
	let W = new List(g.n); W.range(1,g.n);
	regularize(g,d,W,reg);
	return g;
}

/** Create a random simple, regular bipartite graph.
 *  @param g is an undirected graph object
 *  @param ni is the # of input (left-side) vertices 
 *  @param id is the target degree of the inputs
 *  @param no is the # of output (right-side) vertices
 *  @param reg is a pair [ir,or] that controls how regular the graph is;
 *  specifically, the degree of the inputs must differ from id by less than ir
 *  and the degree of outputs must differ from od=ni*id/no by less than or.
 *  if ir=or, one may use a single integer instead of a pair
 *  @param return Graph object with inputs 1..ni, outputs ni+1..ni+no
 */
export function randomRegularBigraph(ni, id, no=ni, reg=1) {
	let od = ni*id/no;

	if (Number.isFinite(reg)) reg = [reg,reg];
	let [ir,or] = reg;

	// first find a nearly d-regular graph
	let d = Math.max(id,od);
	let k = 1; let g = randomBigraph(ni,id,no,[id+ir+k, od+or+k]);
	while (g.m < ni*id) {
		k *= 2; g = randomBigraph(ni,id,no,[id+ir+k, od+or+k]);
	}

	let W = new List(g.n);
	W.range(1,ni);     regularize(g,id,W,ir);
	W.range(ni+1,g.n); regularize(g,od,W,or);

	return g;
}

/** Helper function for regular graph generators. 
 *  @param g is graph being generated
 *  @param d is target vertex degree (need not be an integer)
 *  @param W is a List defining the subset of vertices to be regularized;
 *  the average degrees of vertices in W are assumed to be d initially
 *  @param r allows the regularity requirement to be relaxed; the degrees
 *  of the vertices in W are in the open interval (d-r,d+r) on return;
 */
export function regularize(g, d, W, r=1) {
	let lo = new List(g.n); let under = new List(g.n);
	let hi = new List(g.n); let over = new List(g.n);
	let deg = new Int32Array(g.n+1);

	for (let u = W.first(); u; u = W.next(u)) {
		let du = deg[u] = g.degree(u);
		if (du <= d-r) lo.enq(u);		// vertices in lo require more edges
		else if (du < d) under.enq(u);	// those in under can accept one more
		else if (du >= d+r) hi.enq(u);	// those in hi must lose edges
		else if (du > d) over.enq(u);	// those in over can give up one
	}

	while (!lo.empty() || !hi.empty()) {
		ae() && assert((!lo.empty() || !under.empty()) &&
					 (!hi.empty() || !over.empty()),
					 `RandomGraph.regularize: graph cannot be regularized ` +
					 `${lo.length} ${under.length} ` +
					 `${hi.length} ${over.length}`);
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
			deg[u]++; deg[v]--;
			break;
		}
		if (under.contains(u)) {
			if (deg[u] > d-1) under.deq();
		} else if (deg[u] > d-r) {
			lo.deq(); if (deg[u] < d) under.enq(u);
		}
		if (over.contains(v)) {
			if (deg[v] < d+1) over.deq();
		} else if (deg[v] < d+r) {
			hi.deq(); if (deg[v] > d) over.enq(v);
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

export function scrambleVertices(g, fp) {
}

/** Randomize a graph.
 *  Randomly permute the vertex numbers, edge numbers and edge list
 *  and adjacency list orders, while preserving structure of the graph.
 *  Does not permute edge property values; these should be added to a
 *  random graph after randomization.
 *  @param g is a graph (possibly a digraph or flograph
 *  @param fp is a Set of fixed points; vertices that are not to change
 */
export function randomizeGraph(g, fp) {
	if (!fp) fp = new Set();
	// first create scrambled list of edges and delete edges from g
	let pairs = new Array(g.m+1); let i = 1;
	for (let e = g.first(); e; e = g.next(e)) {
		pairs[i++] = g.constructor.name == 'Digraph' ?
					 [g.tail(e),g.head(e)] : [g.left(e),g.right(e)];
	}
	g.clear();
	let ep = randomPermutation(g.edgeRange); // for remapping edge numbers

	let vp = range(g.n);
	if (!g.hasBipartition) {
		scramble(vp);
	} else {
		// for bipartite graphs, do not change bipartition
		let inputs = new Set(); let outputs = new Set();
		for (let u = 1; u <= g.n; u++) {
			if (g.isInput(u)) inputs.add(u);
			else outputs.add(u);
		}
		scramble(vp,fp.union(inputs));
		scramble(vp,fp.union(outputs));
	}
	for (let e = 1; e < pairs.length; e++) {
		let [u,v] = pairs[e];
		g.join(vp[u],vp[v],ep[e]);
	}
	return [vp,ep];
}

/** Compute random values for a specified edge property of a graph.
 *  @param g is a Graph object
 *  @param pname is the name of an edge property; if not
 *  already present, it is added with a default value of 0
 *  @param rand is a random number generator used to generate the
 *  random edge weights
 *  @param args collects any remaining arguments to randomWeights
 *  into an array; its elements are the arguments to rand.
 *  provided by caller; for example arguments (randomInteger, 1, 10)
 *  will assign random integer weights in 1..10.
 */
export function randomPropertyValues(g, pname, rand, ...args) {
	if (!g[pname]) g.addEdgeProperty([pname,0]);
	for (let e = g.first(); e; e = g.next(e)) {
		g[pname](e, rand(...args));
	}
}

/** Convenience methods for common cases. */
export function randomWeights(g, rand, ...args) {
	randomPropertyValues(g,'weight', rand, ...args);
}

export function randomLengths(g, rand, ...args) {
	randomPropertyValues(g,'length', rand, ...args);
}

export function randomCosts(g, rand, ...args) {
	randomPropertyValues(g,'cost', rand, ...args);
}

export function randomCapacities(g, scale, rand, ...args) {
    randomPropertyValues(g, 'cap', rand, ...args);
	// now apply scale factor to source/sink edges to avoid flow bottlenecks
	let s = g.source; let t = g.sink;
	for (let e = g.first(); e; e = g.next(e)) {
		if (g.tail(e) == s || g.head(e) == t)
			g.cap(e, g.cap(e)*scale);
		if (!g.floor) continue;
		g.cap(e, Math.max(g.floor(e), g.cap(e)));
	}
}

export function randomFloors(g, rand, ...args) {
    randomPropertyValues(g, 'floor', rand, ...args);
	// now make sure floor is no larger than capacity
	for (let e = g.first(); e; e = g.next(e)) {
		g.floor(e, Math.min(g.floor(e), g.cap(e)));
	}
}
