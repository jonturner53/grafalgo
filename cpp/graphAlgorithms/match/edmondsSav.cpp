#include "edmonds.h"

using namespace grafalgo;

// Find a maximum size matching in the graph graf and
// return it as a list of edges.
edmonds::edmonds(Graph& graf1, Dlist& match1, int &size)
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
	
	mSize = stepCount = blossomCount = pathInitTime = pathFindTime = 0;
	int t1, t2, t3;
	t1 = Util::getTime();
	// Create initial maximal (not maximum) matching
	for (u = 1; u <= graf->n(); u++) {
		mEdge[u] = 0; mark[u] = false;
	}
	match->clear(); size = 0;
	for (e = graf->first(); e != 0; e = graf->next(e)) {
		u = graf->left(e); v = graf->right(e);
		if (mEdge[u] == 0 && mEdge[v] == 0) {
			mEdge[u] = mEdge[v] = e;
			match->addLast(e); mSize++;
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

void edmonds::augment(edge e) {
// Modify the matching by augmenting along the path defined by
// the list in the augpath data structure whose last element is e.

	vertex u, v; edge e1;
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
vertex edmonds::nca(vertex u, vertex v) {
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

edge edmonds::path(vertex a, vertex b) {
// Find path joining a and b defined by parent pointers and bridges.
// A is assumed to be a descendant of b, and the path to b from a
// is assumed to pass through the matching edge incident to a.
// Return path in the augpath data structure.
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

// Search for an augmenting path in the graph graf.
// On success, the path data structure will include a list
// that forms the augmenting path. In this case, the last
// edge in the list is returned as the function value.
// On failure, returns 0.
edge edmonds::findpath() {
	vertex u,v,vp,w,wp,x,y; edge e, f;

	int t1, t2, t3;
	t1 = Util::getTime();

	blossoms->clear();
	for (u = 1; u <= graf->n(); u++) {
		state[u] = even; pEdge[u] = 0; origin[u] = u;
	}

	for (e = match->first(); e != 0; e = match->next(e)) {
		u = graf->left(e); v = graf->right(e);
		state[u] = state[v] = unreached;
	}
	List q(graf->m()); // list of edges to be processed in main loop
	for (e = 1; e <= graf->m(); e++) {
		if (state[graf->left(e)] == even ||
		    state[graf->right(e)] == even)
			q.addLast(e);
	}

	t2 = Util::getTime();
	pathInitTime += (t2-t1);
	while (!q.empty()) {
		stepCount++;
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
			t3 = Util::getTime();
			pathFindTime += (t3-t2);
			return e;
		} else if (state[wp] == even) {
			// vp and wp are in same tree - collapse blossom
			blossomCount++;
			x = vp;
			int fu = blossoms->find(u);
			int fx = blossoms->find(x);
			while (fx != fu) {
				fu = blossoms->link(fx,fu);
				if (state[x] == odd) {
					bridge[x].e = e; bridge[x].v = v;
					for (f = graf->firstAt(x); f != 0;
					     f = graf->nextAt(x,f))
						if (!q.member(f)) q.addLast(f);
				}
				x = origin[blossoms->find(
						graf->mate(x,pEdge[x]))];
				fx = blossoms->find(x);
			}
			y = wp;
			int fy = blossoms->find(y);
			while (fy != fu) {
				fu = blossoms->link(fy,fu);
				if (state[y] == odd) {
					bridge[y].e = e; bridge[y].v = w;
					for (f = graf->firstAt(y); f != 0;
					     f = graf->nextAt(y,f))
						if (!q.member(f)) q.addLast(f);
				}
				y = origin[blossoms->find(
						graf->mate(y,pEdge[y]))];
				fy = blossoms->find(y);
			}
			origin[fu] = u;
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
string& edmonds::statString(bool verbose, string& s) {
	string s1;
	if (verbose) {
		s  = "iSize=" + Util::num2string(iSize,s1) + " ";
		s += "mSize=" + Util::num2string(mSize,s1) + " ";
		s += "stepCount=" + Util::num2string(stepCount,s1) + " ";
		s += "blossomCount=" + Util::num2string(blossomCount,s1) + " ";
		s += "imatchTime=" + Util::num2string(imatchTime,s1) + " ";
		s += "rmatchTime=" + Util::num2string(rmatchTime,s1) + " ";
		s += "pathInitTime=" + Util::num2string(pathInitTime,s1) + " ";
		s += "pathFindTime=" + Util::num2string(pathFindTime,s1);
	} else {
		s  = Util::num2string(iSize,s1) + " ";
		s += Util::num2string(mSize,s1) + " ";
		s += Util::num2string(stepCount,s1) + " ";
		s += Util::num2string(blossomCount,s1) + " ";
		s += Util::num2string(imatchTime,s1) + " ";
		s += Util::num2string(rmatchTime,s1) + " ";
		s += Util::num2string(pathInitTime,s1) + " ";
		s += Util::num2string(pathFindTime,s1);
	}
	return s;
}
