/** @file priorityMatch.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "priorityMatch.h"

namespace grafalgo {

/** Find a maximum size matching.
 *  @param g1 is an undirected graph
 *  @param priority[i] is priority assigned to vertex i
 *  @param match is a list in which the matching is returned
 */
priorityMatch::priorityMatch(Graph& g1, int* priority, Glist<edge>& match)
		: g(&g1), prty(priority) {
	blossoms = new Partition(g->n()); // set per blossom
	augpath = new RlistSet(g->m());    // reversible list
	origin = new vertex[g->n()+1];    // original vertex for each blossom
	bridge = new BridgePair[g->n()+1];// edge that formed a blossom
	state = new stype[g->n()+1];	     // state used in path search
	pEdge = new edge[g->n()+1];	     // edge to parent in tree
	mEdge = new edge[g->n()+1];	     // incident matching edge (if any)
	mark = new bool[g->n()+1];	     // mark bits used by nca
	
	// Create initial maximal (not maximum) priority matching
	for (vertex u = 1; u <= g->n(); u++) {
		mEdge[u] = 0; mark[u] = false;
	}
	for (int i = 1; i <= g->n(); i++) {
		for (vertex u = 1; u <= g->n(); u++) {
			if (prty[u] != i || mEdge[u] != 0) continue;
			for (edge e = g->firstAt(u); e!=0; e = g->nextAt(u,e)) {
				vertex v = g->right(e);
				if (mEdge[v] == 0) {
					mEdge[u] = mEdge[v] = e; break;
				}
			}
		}
	}

	int i = 1; // now, build max priority matching	
	while(i <= g->n) {
		edge e;
		if ((e = findpath(i)) != 0) augment(e);
		else i++;
	}

	// return matching in match list
	match.clear(); 
	for (vertex u = 1; u <= g->n(); u++) {
		if (mEdge[u] != 0 && u < g->mate(u,mEdge[u])) {
			match.addLast(mEdge[u]); 
		}
	}

	delete blossoms; delete augpath; delete [] origin;
	delete [] bridge; delete [] pEdge; delete [] mEdge; delete[] mark;
}

/** Augment the matching.
 *  @param e is the "last" edge in the augmenting path;
 *  the first edge is assumed to be unmatched
 */
void priorityMatch::augment(edge e) {
	vertex x = g->left(e); // find last vertex in path
	edge ee = augpath->prev(x);
	if (ee != e && (x == g->left(ee) || x = g->right(ee))
		x = g->mate(x,e);
	mEdge[x] = 0;  // unmatch last vertex
	while (e != 0) {
		edge e1 = augpath->first(e);
		mEdge[g->left(e1)] = mEdge[g->right(e1)] = e1;
		if (e == augpath->first(e)) return;
		e = augpath->pop(e); e = augpath->pop(e);
	}
}

/** Find the nearest common ancestor of two vertices in
 *  the current "condensed graph".
 *  To avoid excessive search time, search upwards from both vertices in
 *  parallel, using mark bits to identify the nca. Before returning,
 *  clear the mark bits by traversing the paths a second time.
 *  The mark bits are initialized in the constructor.
 *  @param u is a vertex in the tree constructed by findpath
 *  @param v is another vertex in the same tree
 *  @param return the enarest common ancestor of u and v
 */
vertex priorityMatch::nca(vertex u, vertex v) {
	vertex x,px,y,py,result;

	// first pass to find the nca
	x = u; px = (pEdge[x] != 0 ? g->mate(x,pEdge[x]) : 0);
	y = v; py = (pEdge[y] != 0 ? g->mate(y,pEdge[y]) : 0);
	while (true) {
		if (x == y) { result = x; break; }
		if (px == 0 &&  py == 0) { result = 0; break; }
		if (px != 0) {
			if (mark[x]) { result = x; break; }
			mark[x] = true;
			x = origin[blossoms->find(px)];
			px = (pEdge[x] != 0 ? g->mate(x,pEdge[x]) : 0);
		}
		if (py != 0) {
			if (mark[y]) { result = y; break; }
			mark[y] = true;
			y = origin[blossoms->find(py)];
			py = (pEdge[y] != 0 ? g->mate(y,pEdge[y]) : 0);
		}
	}
	// second pass to clear mark bits
	x = u, y = v; 
	while (mark[x] || mark[y]) {
		mark[x] = mark[y] = false;
		px = (pEdge[x] != 0 ? g->mate(x,pEdge[x]) : 0);
		py = (pEdge[y] != 0 ? g->mate(y,pEdge[y]) : 0);
		x = (px == 0 ? x : origin[blossoms->find(px)]);
		y = (py == 0 ? y : origin[blossoms->find(py)]);
	}
	return result;
}

/** Find alternating path joining two vertices in the same tree.
 *  @param a is a matched vertex in some tree defined by parent
 *  pointers
 *  @param b is an ancestor of a
 *  @return the path in the augpath object
 */
edge priorityMatch::path(vertex a, vertex b) {
	vertex pa, p2a, da; edge e, e1, e2;
	if (a == b) return 0;
	if (state[a] == even) {
		e1 = pEdge[a];  
		pa = g->mate(a,e1);
		if (pa == b) return e1;
		e2 = pEdge[pa]; 
		p2a = g->mate(pa,e2);
		e = augpath->join(e1,e2);
		e = augpath->join(e,path(p2a,b));
		return e;
	} else {
		e = bridge[a].e; da = bridge[a].v;
		e = augpath->join(augpath->reverse(path(da,a)),e);
		e = augpath->join(e,path(g->mate(da,e),b));
		return e;
	}
}

/** Find the root of a tree.
 *  @vertex vp is either an external vertex or the base of some blossom
 *  @return the root of the tree containing vp
 */
vertex priorityMatch::root(vertex vp) {
	vertex rv = vp;
	while (pEdge[rv] != 0) rv = base(g->mate(rv,pEdge[rv]));
	return rv;
}

/** Search for an augmenting path.
 *  @return an unmatched edge on the augmenting path or 0 if
 *  no augmenting path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the augmenting path.
 */
edge priorityMatch::findpath(int i) {
	blossoms->clear();
	List q(g->m()); // list of edges to be processed in main loop
	for (vertex u = 1; u <= g->n(); u++) {
		pEdge[u] = 0; origin[u] = u; state[u] = unreached;
		if (prty[u] == i && mEdge[u] == 0) {
			state[u] = even;
			for (edge e = g->firstAt(u); e != 0; e = g->nextAt(u,e))
				q.addLast(e);
		}
	}

	while (!q.empty()) {
		edge e = q.first(); q.removeFirst();
		vertex u = g->left(e); vertex up = base(u);
		if (state[up] != even) {
			u = g->right(e); up = base(u);
		}
		vertex v = g->mate(u,e); vp = base(v);
		if (up == vp) continue; // skip internal edges in a blossom
		if (state[vp] == unreached && mEdge[v] != 0) {
			// v is not contained in a tree and is matched
			// so extend tree, check for augmenting path
			// and if none, add newly eligible edges to q
			vertex w = g->mate(v,mEdge[v]);
			state[v] = odd;  pEdge[v] = e;
			state[w] = even; pEdge[w] = mEdge[v];
			if (prty[w] > i) // found augmenting path
				return augpath->reverse(path(w,root(up)));
			for (edge ee = g->firstAt(x); ee != 0;
			     	  ee = g->nextAt(x,ee)) {
				if ((ee != mEdge[x]) && !q.member(ee))
					q.addLast(ee);
			}
			continue;
		}
		if (state[vp] == unreached && mEdge[v] == 0) {
			return augpath->join(
					augpath->reverse(path(u,root(u))),e);
			continue;
		}
		vertex a = nca(up,vp);
		if (state[vp] == even && a == 0) {
			// up, vp in different trees - construct path & return
			edge ee = augpath->join(augpath->reverse(
						path(u,root(u))),e);
			return = augpath->join(ee,path(v,root(v)));
		} else if (state[vp] == even) {
			// up and vp are in same tree
			// first, check for augmenting path
			vertex x = up;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				if (prty[x] > i)
					return augpath->reverse(
						path(x,root(x)));
				x = base(g->mate(x,pEdge[x]));
			}
			x = vp;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				if (prty[x] > i)
					return augpath->reverse(
						path(x,root(x)));
				x = base(g->mate(x,pEdge[x]));
			}
			// collapse the blossom and add eligible edges
			x = up;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				origin[blossoms->link(x,blossoms->find(a))] = a;
				bridge[x].e = e; bridge[x].v = v;
				for (edge ee = g->firstAt(x); ee != 0;
				     	  ee = g->nextAt(x,ee)) {
					if (!q.member(ee)) q.addLast(ee);
				}
				x = base(g->mate(x,pEdge[x]));
				origin[blossoms->link(blossoms->find(x),
						      blossoms->find(a))] = a;
			}
			x = vp;
			while (x != a) {
				x = g->mate(x,pEdge[x]); // x now odd
				origin[blossoms->link(x,blossoms->find(a))] = a;
				bridge[x].e = e; bridge[x].v = v;
				for (edge ee = g->firstAt(x); ee != 0;
				     	  ee = g->nextAt(x,ee)) {
					if (!q.member(ee)) q.addLast(ee);
				}
				x = base(g->mate(x,pEdge[x]));
				origin[blossoms->link(blossoms->find(x),
						      blossoms->find(a))] = a;
			}
		} 
	}
	return 0;
}

} // ends namespace
