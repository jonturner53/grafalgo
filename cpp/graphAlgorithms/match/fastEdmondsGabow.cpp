/** @file fastEdmondsGabow.cpp
 * 
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "fastEdmondsGabow.h"

namespace grafalgo {

/** Find a maximum size matching in a graph.
 *  @param g1 is a graph
 *  @param match is a reference to a list in which the matching is returned.
 */
fastEdmondsGabow::fastEdmondsGabow(Graph& g1, Glist<edge>& match) : g(&g1) {
	vertex u, v; edge e;
	blossoms = new Partition(g->n()); // set per blossom
	augpath = new RlistSet(g->m());    // reversible list
	origin = new vertex[g->n()+1];    // original vertex for each blossom
	bridge = new BridgePair[g->n()+1];// edge that formed a blossom
	state = new stype[g->n()+1];	     // state used in path search
	pEdge = new edge[g->n()+1];	     // edge to parent in tree
	mEdge = new edge[g->n()+1];	     // incident matching edge (if any)
	mark = new bool[g->n()+1];	     // mark bits used by nca

	// auxiliary data structures for reducing initialization overhead
	// in findpath
	searchNum = 0;
	latestSearch = new int[g->n()+1]; // equals search number if reached
	nextEdge = new edge[g->n()+1];    // next edge to search at u
	pending = new List(g->n());     // used by findpath
	unmatched = new Dlist(g->n());  // list of unmatched vertices

	// Create initial maximal (not maximum) matching
	for (u = 1; u <= g->n(); u++) {
		mEdge[u] = 0; mark[u] = false; latestSearch[u] = 0;
		nextEdge[u] = g->firstAt(u);
		unmatched->addLast(u);
	}
	for (u = 1; u <= g->n(); u++) {
		if (mEdge[u] != 0) continue;
		for (e = g->firstAt(u); e != 0; e = g->nextAt(u,e)) {
			v = g->mate(u,e);
			if (mEdge[v] == 0) {
				mEdge[u] = mEdge[v] = e;
				unmatched->remove(u);
				unmatched->remove(v);
				break;
			}
		}
	}
		
	while((e = findpath()) != 0) { augment(e); } 

	match.clear();
	for (vertex u = 1; u <= g->n(); u++) {
		edge e = mEdge[u];
		if (e != 0 && u < g->mate(u,e)) match.addLast(e);
	}

	delete blossoms; delete augpath; delete [] origin;
	delete [] bridge; delete [] pEdge; delete [] mEdge; delete[] mark;
}

/** Modify the matching by augmenting along a path.
 *  @param e is an edge number for the last edge of a list in the
 *  augpath data structure; this list specifies an augmenting path
 */
void fastEdmondsGabow::augment(edge e) {
	while (true) {
		edge e1 = augpath->first(e);
		mEdge[g->left(e1)] = mEdge[g->right(e1)] = e1;
		if (e == augpath->first(e)) return;
		e = augpath->pop(e);
		e = augpath->pop(e);
	}
}

/** Find the nearest common ancestor of two vertices in the same tree.
 *  @param u is a vertex
 *  @param v is another vertex;
 *  if u and v are in the same tree, return their nearest common
 *  ancestor in the current "condensed graph"; to avoid excessive
 *  search time, search upwards from both vertices in parallel, using
 *  mark bits to identify the nca; before returning, clear the mark
 *  bits by traversing the paths a second time; the mark bits are
 *  initialized in the constructor.
 */
vertex fastEdmondsGabow::nca(vertex u, vertex v) {
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

/** Find path joining two vertices.
 *  @param a is vertex
 *  @param b is an ancestor of a and the path joining a and b is
 *  assumed to pass through the matching edge at a
 *  @return path in the augpath data structure.
 */
edge fastEdmondsGabow::path(vertex a, vertex b) {
	vertex pa, p2a, da; edge e, e1, e2;
	if (a == b) { return 0; }
	if (state[a] == even) {
		e1 = pEdge[a];  
		pa = g->mate(a,e1);
		if (pa == b) { return e1; }
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

/** Search for an augmenting path in the graph.
 *  @return the "last" edge on the augmenting path (or 0 if none is found);
 *  on success, the returned edge identifies a list of edges in the 
 *  augpath data structure that forms the augmenting path
 */
edge fastEdmondsGabow::findpath() {
	vertex u,v,vp,w,wp,x,y; edge e;

	pending->clear();
	vertex nextUnmatched = unmatched->first();

	searchNum++;
	while (true) {
		if (nextUnmatched != 0) {
			// initialize the next unmatched vertex and add
			// it to pending
			// doing it this way to reduce initialization overhead
			// when search ends fast
			pending->addLast(nextUnmatched);
			state[nextUnmatched] = even;
			pEdge[nextUnmatched] = 0;
			origin[nextUnmatched] = nextUnmatched;
			blossoms->clear(nextUnmatched);
			latestSearch[nextUnmatched] = searchNum;
			nextEdge[nextUnmatched] = g->firstAt(nextUnmatched);
			nextUnmatched = unmatched->next(nextUnmatched);
		}
		if (pending->empty()) break;
			
		v = pending->first(); e = nextEdge[v];
		if (e == 0) {
			pending->removeFirst(); continue;
		} else {
			nextEdge[v] = g->nextAt(v,e);
		}
		w = g->mate(v,e);
		if (latestSearch[w] != searchNum && mEdge[w] != 0) {
			// w not yet reached in this search, so can't be
			// part of any blossom yet
			// extend the tree
			x = g->mate(w,mEdge[w]);
			state[w] = odd;  pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[w];
			origin[w] = w; origin[x] = x;
			latestSearch[w] = latestSearch[x] = searchNum;
			blossoms->clear(w); blossoms->clear(x);
			pending->addLast(x);
			nextEdge[x] = g->firstAt(x);
			continue;
		}
		if (latestSearch[w] != searchNum) {
			// w is a tree root that hasn't been initialized yet
			// so, initialize and add to pending
			pending->addLast(w);
			state[w] = even;
			pEdge[w] = 0;
			origin[w] = w;
			blossoms->clear(w);
			latestSearch[w] = searchNum;
			nextEdge[w] = g->firstAt(w);
		}
		vp = origin[blossoms->find(v)];
		wp = origin[blossoms->find(w)];
		if (vp == wp) continue; // skip internal edges in a blossom
		u = nca(vp,wp);
		if ((state[wp] == even || latestSearch[w] != searchNum) &&
		    u == 0) {
			// vp, wp are different trees - construct path & return
			x = vp;
			while (pEdge[x] != 0) {
				x = origin[blossoms->find(
						g->mate(x,pEdge[x])
					)];
			}
			y = wp;
			while (pEdge[y] != 0) {
				y = origin[blossoms->find(
						g->mate(y,pEdge[y])
					)];
			}
			e = augpath->join(augpath->reverse(path(v,x)),e);
			e = augpath->join(e,path(w,y));
			// x and y will soon be matched
			unmatched->remove(x); unmatched->remove(y);
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
					if (!pending->member(x))
						pending->addLast(x);
				}
				x = origin[blossoms->find(
					g->mate(x,pEdge[x]))];
			}
			x = wp;
			while (x != u) {
				origin[blossoms->link(
					blossoms->find(x),
					blossoms->find(u))] = u;
				if (state[x] == odd) {
					bridge[x].e = e; bridge[x].v = w;
					if (!pending->member(x))
						pending->addLast(x);
				}
				x = origin[blossoms->find(
					g->mate(x,pEdge[x]))];
			}
		} 
	}
	return 0;
}

} // ends namespace
