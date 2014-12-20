/** @file fastEdmondsGabow.cpp
 * 
 *  @author Jon Turner
 *  @date 2012
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "fastEdmondsGabow.h"

using namespace grafalgo;

// Find a maximum size matching in the graph graf and
// return it as a list of edges.
fastEdmonds::fastEdmondsGabow(Graph& graf1, Dlist& match1, int &size)
		 : graf(&graf1), match(&match1) {
	vertex u, v; edge e;
	blossoms = new Partition(graf->n()); // set per blossom
	augpath = new RlistSet(graf->m());    // reversible list
	origin = new vertex[graf->n()+1];    // original vertex for each blossom
	bridge = new BridgePair[graf->n()+1];// edge that formed a blossom
	state = new stype[graf->n()+1];	     // state used in path search
	pEdge = new edge[graf->n()+1];	     // edge to parent in tree
	mEdge = new edge[graf->n()+1];	     // incident matching edge (if any)
	mark = new bool[graf->n()+1];	     // mark bits used by nca

	// auxiliary data structures for reducing initialization overhead
	// in findpath
	searchNum = 0;
	latestSearch = new int[graf->n()+1]; // equals search number if reached
	nextEdge = new edge[graf->n()+1];    // next edge to search at u
	pending = new List(graf->n());     // used by findpath
	unmatched = new Dlist(graf->n());  // list of unmatched vertices

	mSize = stepCount = blossomCount = pathInitTime = pathFindTime = 0;
	int t1, t2, t3;
	t1 = Util::getTime();
	// Create initial maximal (not maximum) matching
	for (u = 1; u <= graf->n(); u++) {
		mEdge[u] = 0; mark[u] = false; latestSearch[u] = 0;
		nextEdge[u] = graf->firstAt(u);
		unmatched->addLast(u);
	}
	match->clear(); size = 0;
	for (u = 1; u <= graf->n(); u++) {
		if (mEdge[u] != 0) continue;
		for (e = graf->firstAt(u); e != 0; e = graf->nextAt(u,e)) {
			v = graf->mate(u,e);
			if (mEdge[v] == 0) {
				mEdge[u] = mEdge[v] = e;
				match->addLast(e); mSize++;
				unmatched->remove(u);
				unmatched->remove(v);
				break;
			}
		}
	}
	iSize = mSize;
		
	t2 = Util::getTime();
	imatchTime = (t2-t1);
	while((e = findpath()) != 0) { augment(e); mSize++; }
	size = mSize;
	t3 = Util::getTime();
	rmatchTime = (t3-t2);

	delete blossoms; delete augpath; delete [] origin;
	delete [] bridge; delete [] pEdge; delete [] mEdge; delete[] mark;
}

// Modify the matching by augmenting along the path defined by
// the list in the augpath data structure whose last element is e.
void fastEdmonds::augment(edge e) {
	edge e1;
	while (true) {
		e1 = augpath->first(e);
		if (match->member(e1)) match->remove(e1);
		else {
			match->addLast(e1);
			mEdge[graf->left(e1)] = mEdge[graf->right(e1)] = e1;
		}
		if (e == augpath->first(e)) break;
		e = augpath->pop(e);
	}
}

// If u and v are in the same tree, return their nearest common
// ancestor in the current "condensed graph". To avoid excessive
// search time, search upwards from both vertices in parallel, using
// mark bits to identify the nca. Before returning, clear the mark
// bits by traversing the paths a second time. The mark bits are
// initialized in the constructor.
vertex fastEdmonds::nca(vertex u, vertex v) {
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

// Find path joining a and b defined by parent pointers and bridges.
// A is assumed to be a descendant of b, and the path to b from a
// is assumed to pass through the matching edge incident to a.
// Return path in the augpath data structure.
edge fastEdmonds::path(vertex a, vertex b) {
	vertex pa, p2a, da; edge e, e1, e2;
	if (a == b) { return 0; }
	if (state[a] == even) {
		e1 = pEdge[a];  
		pa = graf->mate(a,e1);
		if (pa == b) { return e1; }
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

// Search for an augmenting path in the graph graf.
// On success, the path data structure will include a list
// that forms the augmenting path. In this case, the last
// edge in the list is returned as the function value.
// On failure, returns 0.
edge fastEdmonds::findpath() {
	vertex u,v,vp,w,wp,x,y; edge e;

	int t1, t2, t3;
	t1 = Util::getTime();

	searchNum++;
	pending->clear();
	vertex nextUnmatched = unmatched->first();

	t2 = Util::getTime();
	pathInitTime += (t2-t1);
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
			nextEdge[nextUnmatched] = graf->firstAt(nextUnmatched);
			nextUnmatched = unmatched->next(nextUnmatched);
		}
		if (pending->empty()) break;
			
		v = pending->first(); e = nextEdge[v];
		if (e == 0) {
			pending->removeFirst(); continue;
		} else {
			nextEdge[v] = graf->nextAt(v,e);
		}
		stepCount++;
		w = graf->mate(v,e);
		if (latestSearch[w] != searchNum && mEdge[w] != 0) {
			// w not yet reached in this search, so can't be
			// part of any blossom yet
			// extend the tree
			x = graf->mate(w,mEdge[w]);
			state[w] = odd;  pEdge[w] = e;
			state[x] = even; pEdge[x] = mEdge[w];
			origin[w] = w; origin[x] = x;
			latestSearch[w] = latestSearch[x] = searchNum;
			blossoms->clear(w); blossoms->clear(x);
			pending->addLast(x);
			nextEdge[x] = graf->firstAt(x);
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
			nextEdge[w] = graf->firstAt(w);
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
						graf->mate(x,pEdge[x])
					)];
			}
			y = wp;
			while (pEdge[y] != 0) {
				y = origin[blossoms->find(
						graf->mate(y,pEdge[y])
					)];
			}
			e = augpath->join(augpath->reverse(path(v,x)),e);
			e = augpath->join(e,path(w,y));
			// x and y will soon be matched
			unmatched->remove(x); unmatched->remove(y);
			t3 = Util::getTime();
			pathFindTime += (t3-t2);
			return e;
		} else if (state[wp] == even) {
			// vp and wp are in same tree - collapse blossom
			blossomCount++;
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
					graf->mate(x,pEdge[x]))];
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
					graf->mate(x,pEdge[x]))];
			}
		} 
	}
	t3 = Util::getTime();
	pathFindTime += (t3-t2);
	return 0;
}

/** Create string containing statistics.
 *
 *  @param verbose if true, return fully labeled string; otherwise
 *  returned string contains just the values
 *  @param s is reference to string in which result is returned
 */
string& fastEdmonds::statString(bool verbose, string& s) {
	stringstream ss;
	if (verbose) {
		ss << "iSize=" << iSize << " ";
		ss << "mSize=" << mSize << " ";
		ss << "stepCount=" << stepCount << " ";
		ss << "blossomCount=" << blossomCount << " ";
		ss << "imatchTime=" << imatchTime << " ";
		ss << "rmatchTime=" << rmatchTime << " ";
		ss << "pathInitTime=" << pathInitTime << " ";
		ss << "pathFindTime=" << pathFindTime;
	} else {
		ss << iSize << " " << mSize << " ";
		ss << stepCount << " " << blossomCount << " ";
		ss << imatchTime << " "<< rmatchTime << " ";
		ss << pathInitTime << " " << pathFindTime;
	}
	s = ss.str();
	return s;
}
