 /** @file RandomGraph.mjs 
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';
import { randomInteger, scramble } from '../../common/Random.mjs';
import List from '../../dataStructures/basic/List.mjs';
import ArrayHeap from '../../dataStructures/heaps/ArrayHeap.mjs';
import Graph from '../../dataStructures/graphs/Graph.mjs';
import Digraph from '../../dataStructures/graphs/Digraph.mjs';
import Flograph from '../../dataStructures/graphs/Flograph.mjs';
import maxflowD from '../maxflow/maxflowD.mjs';
import bimatchF from '../match/bimatchF.mjs';

/** Generate an undirected random graph. 
 *  @param n is the number of vertices in the random graph
 *  @param d is the average vertex degree
 *  @return the generated graph
 */  
export function randomGraph(n, d) {
	if (d > n-1) d = n-1;
	let m = ~~(d*n/2);
	let g = new Graph(n, m);
	let mm = n*(n-1)/2;
	add2graph(g, m, m > mm/3,
					([u,v]) => (n < 2 || u == n-1 && v == n ? null :
						    	(u == 0 ? [1,2] :
								 (v < n ? [u,v+1] : [u+1,u+2]))),
					() => { let u = randomInteger(1,n-1);
							return [u, randomInteger(u+1, n)]; }); 
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
 *  @param n1 specifies the number of vertices in the "left part"
 *  @param n2 specifies the number of vertices in the "right part"
 *  @param d1 is the average vertex degree in the left part
 */
export function randomBigraph(n1, d1, n2=n1) {
	n1 = Math.max(1,n1); n2 = Math.max(1,n2); d1 = Math.min(d1, n2);
	let m = ~~(d1*n1);
	let g = new Graph(n1+n2, m);
	let mm = n1*n2;
	add2graph(g, m, m > mm/3,
					([u,v]) => (u == 0 ? [1, n1+1] :
							   (v < n1+n2 ? [u, v+1] :
								(u < n1 ? [u+1, n1+1] : null))),
					() => [randomInteger(1,n1), randomInteger(n1+1,n1+n2)]);
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
	g.setSource(1); g.setSink(g.n);
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
 *  @param up is a flag; if true, add edges [u,v] with u<v;
 *  if false pairs are not constrained
 */
function add2graph(g, m, dense, nextpair, randpair) {
	if (m <= g.m) return;

	// generate vector of candidate edges to select new edges from
	let pairs = [];
	if (dense) {
		let p = nextpair([0,0]);
		while (p) { pairs.push(p); p = nextpair(p); }
	} else {
		for (let i = 0; i < (m-g.m) + Math.max(200, (m-g.m)); i++)
			pairs.push(randpair());
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
 *  @param return a random d-regular graph with n vertices,
 *  or n+1 if both n and d are odd

Suppose we create random perfect matchings with enough extra to
ensure that there are not too many duplicate edges; then eliminate
duplicates and then sample matchings from subgraph? Maybe find
max degree matchings?

Creating a random matching. Maintain a vector of unmatched vertices.
Sample a pair from vector and swap selected vertices to the end.

 */
export function randomRegularGraph(n, d) {
	ea && assert(n > d);
	if ((n & 1) && (d & 1)) n++;

	let m = ~~(n*d/2); let g = new Graph(n, m);
	let deg = new Int32Array(n+1).fill(0); // deg[u] = degree of vertex u
	let nabor = new Int32Array(n+1).fill(false);	
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
//may be more efficient to generate a vector of random edges
//all at once and then sample from the vector
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
 *  @param d1 is the degree of the vertices in the "left" partition
 *  @param n2 is the # of vertices in the "right" partition
 *  @param noSelf excludes edges of the form (i, n2+i), when true
 *  if d2=n1*d1/n2 is an integer, then the right-hand vertices all
 *  have degree d2, otherwise they have degree floor(d2) or floor(d2)+1


alternate approach
1. create random bigraph with at least d edges per vertex
   - say by making d extra large and just counting on randomness
	 randomBigraph(n1,n2,2*(d1+Math.floor(Math.ln(n1+n2)));
   - or by doing exactly d on the left, then augmenting vertices
   - on the left with a deficit - may get repeats this way
2. find perfect d-match in graph

yet another approach
1. for each left vertex, select d random neighbors, while tracking
   vertex degrees of right vertices
2. maintain vector of eligible vertices and sample from this vector,
   swapping selected neighbors with last in vector; when a new neighbor
   becomes ineligible, reduce the vector length by 1
3. if d1 is left-hand degree and d2=n1*d1/n2, limit the number of neighbors
   with degree=floor(d2)+1
4. if k is the number of remaining left vertices and some right vertex has
   d2-k neighbors, switch to sampling by flow graph; this should only happen
   when k is fairly small, so should not be too expensive
 */


export function randomRegularBigraph(n, d) {
	let g = randomBigraph(n,d+2*Math.ceil(Math.log(n)));
	let dmin = new Int32Array(2*n+1).fill(d);
	let [match] = bimatchF(g,0,null,dmin,dmin);
	g.reset(n,d*n); g.assign(match);
	return g;
}

/*
export function randomRegularBigraph(n1, d1, n2=n1, noSelf=false) {
	ea && assert(n1 > 0 && d1 > 0 && n2 >= d1);
	if ((n1 & 1) && (d1 & 1)) n1++;
	let d2 = Math.ceil(n1*d1/n2);
	let m = d1*n1;	// # of edges
	let dl = new Int32Array(n1+1); let dr = new Int32Array(n2+1);
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
		let j = 1;
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
*/
