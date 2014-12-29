/** @file edmondsGabow.cpp
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "edmondsGabow.h"

using namespace grafalgo;

/** Find a maximum size matching.
 *  @param graf1 is an undirected graph
 *  @param match is a list in which the matching is returned
 */
edmondsGabow::edmondsGabow(Graph& graf1, Glist<edge>& match) : graf(&graf1) {
	blossoms = new Partition(graf->n()); // set per blossom
	augpath = new RlistSet(graf->m());    // reversible list
	origin = new vertex[graf->n()+1];    // original vertex for each blossom
	bridge = new BridgePair[graf->n()+1];// edge that formed a blossom
	state = new stype[graf->n()+1];	     // state used in path search
	pEdge = new edge[graf->n()+1];	     // edge to parent in tree
	mEdge = new edge[graf->n()+1];	     // incident matching edge (if any)
	mark = new bool[graf->n()+1];	     // mark bits used by nca
	
	// Create initial maximal (not maximum) matching
	for (vertex u = 1; u <= graf->n(); u++) {
		mEdge[u] = 0; mark[u] = false;
	}
	for (edge e = graf->first(); e != 0; e = graf->next(e)) {
		vertex u = graf->left(e); vertex v = graf->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e;
		}
	}
		
	edge e;
	while((e = findpath()) != 0) augment(e);

	match.clear(); 
	for (vertex u = 1; u <= graf->n(); u++) {
		if (mEdge[u] != 0 && u < graf->mate(u,mEdge[u])) {
			match.addLast(mEdge[u]); 
		}
	}

	delete blossoms; delete augpath; delete [] origin;
	delete [] bridge; delete [] pEdge; delete [] mEdge; delete[] mark;
}

/** Augment the matching.
 *  @param e is the "last" edge in the augmenting path
 */
void edmondsGabow::augment(edge e) {
	while (true) {
		edge e1 = augpath->first(e);
		mEdge[graf->left(e1)] = mEdge[graf->right(e1)] = e1;
		if (e == augpath->first(e)) { return; }
		e = augpath->pop(e);
		e = augpath->pop(e);
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
vertex edmondsGabow::nca(vertex u, vertex v) {
	vertex x,px,y,py,result;

	// first pass to find the nca
	x = u; px = (pEdge[x] != 0 ? graf->mate(x,pEdge[x]) : 0);
	y = v; py = (pEdge[y] != 0 ? graf->mate(y,pEdge[y]) : 0);
	while (true) {
		if (x == y) { result = x; break; }
		if (px == 0 &&  py == 0) { result = 0; break; }
		if (px != 0) {
			if (mark[x]) { result = x; break; }
			mark[x] = true;
			x = origin[blossoms->find(px)];
			px = (pEdge[x] != 0 ? graf->mate(x,pEdge[x]) : 0);
		}
		if (py != 0) {
			if (mark[y]) { result = y; break; }
			mark[y] = true;
			y = origin[blossoms->find(py)];
			py = (pEdge[y] != 0 ? graf->mate(y,pEdge[y]) : 0);
		}
	}
	// second pass to clear mark bits
	x = u, y = v; 
	while (mark[x] || mark[y]) {
		mark[x] = mark[y] = false;
		px = (pEdge[x] != 0 ? graf->mate(x,pEdge[x]) : 0);
		py = (pEdge[y] != 0 ? graf->mate(y,pEdge[y]) : 0);
		x = (px == 0 ? x : origin[blossoms->find(px)]);
		y = (py == 0 ? y : origin[blossoms->find(py)]);
	}
	return result;
}

/** Find path joining two vertices in the same tree.
 *  @param a is a matched vertex in some tree defined by parent
 *  pointers
 *  @param b is an ancestor of a, and the path from a to b is
 *  @return the path in the augpath object
 */
edge edmondsGabow::path(vertex a, vertex b) {
	vertex pa, p2a, da; edge e, e1, e2;
	if (a == b) return 0;
	if (state[a] == even) {
		e1 = pEdge[a];  
		pa = graf->mate(a,e1);
		if (pa == b) return e1;
		e2 = pEdge[pa]; 
		p2a = graf->mate(pa,e2);
		e = augpath->join(e1,e2);
		e = augpath->join(e,path(p2a,b));
		return e;
	} else {
		e = bridge[a].e; da = bridge[a].v;
		e = augpath->join(augpath->reverse(path(da,a)),e);
		e = augpath->join(e,path(graf->mate(da,e),b));
		return e;
	}
}

/** Search for an augmenting path.
 *  @return an unmatched edge on the augmenting path or 0 if
 *  no augmenting path is found; on success, the list in the augpath data
 *  structure that includes the returned edge defines the augmenting path.
 */
edge edmondsGabow::findpath() {
	vertex u,v,vp,w,wp,x,y; edge e, f;

	blossoms->clear();
	for (u = 1; u <= graf->n(); u++) {
		state[u] = (mEdge[u] == 0 ? even : unreached);
		pEdge[u] = 0; origin[u] = u;
	}

	List q(graf->m()); // list of edges to be processed in main loop
	for (e = 1; e <= graf->m(); e++) {
		if (state[graf->left(e)] == even ||
		    state[graf->right(e)] == even)
			q.addLast(e);
	}

	while (!q.empty()) {
		e = q.first(); q.removeFirst();
		v = graf->left(e); vp = origin[blossoms->find(v)];
		if (state[vp] != even) {
			v = graf->right(e); vp = origin[blossoms->find(v)];
		}
		w = graf->mate(v,e); wp = origin[blossoms->find(w)];
		if (vp == wp) continue; // skip internal edges in a blossom
		if (state[wp] == unreached) {
			// w is not contained in a blossom and is matched
			// so extend tree and add newly eligible edges to q
			x = graf->mate(w,mEdge[w]);
			state[w] = odd;  pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[w];
			for (f = graf->firstAt(x); f != 0;
			     f = graf->nextAt(x,f)) {
				if ((f != mEdge[x]) && !q.member(f))
					q.addLast(f);
			}
			continue;
		}
		u = nca(vp,wp);
		if (state[wp] == even && u == 0) {
			// vp, wp are different trees - construct path & return
			x = vp;
			while (pEdge[x] != 0) {
				x = origin[blossoms->find(
						graf->mate(x,pEdge[x]))];
			}
			y = wp;
			while (pEdge[y] != 0) {
				y = origin[blossoms->find(
						graf->mate(y,pEdge[y]))];
			}
			e = augpath->join(augpath->reverse(path(v,x)),e);
			e = augpath->join(e,path(w,y));
			return e;
		} else if (state[wp] == even) {
			// vp and wp are in same tree - collapse blossom
			x = vp;
			while (x != u) {
				origin[blossoms->link(
					blossoms->find(x),
					blossoms->find(u))] = u;
				if (state[x] == odd) {
					bridge[x].e = e; bridge[x].v = v;
					for (f = graf->firstAt(x); f != 0;
					     f = graf->nextAt(x,f))
						if (!q.member(f)) q.addLast(f);
				}
				x = origin[blossoms->find(
						graf->mate(x,pEdge[x]))];
			}
			x = wp;
			while (x != u) {
				origin[blossoms->link(
					blossoms->find(x),
					blossoms->find(u))] = u;
				if (state[x] == odd) {
					bridge[x].e = e; bridge[x].v = w;
					for (f = graf->firstAt(x); f != 0;
					     f = graf->nextAt(x,f))
						if (!q.member(f)) q.addLast(f);
				}
				x = origin[blossoms->find(
						graf->mate(x,pEdge[x]))];
			}
		} 
	}
	return 0;
}
