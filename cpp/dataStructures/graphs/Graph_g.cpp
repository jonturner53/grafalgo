/** @file Graph_g.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "stdinc.h"
#include "Graph_g.h"

namespace grafalgo {

/** Construct a Graph_g with space for a specified number of
 *  vertices and edges.
 *  @param numv is number of vertices in the graph
 *  @param maxe is the maximum number of edges
 */
Graph_g::Graph_g(int numv, int maxe) : Graph(numv,maxe) {
	makeSpace(); init();
}

/** Free space used by Graph_g */
Graph_g::~Graph_g() { freeSpace(); }

/** Allocate dynamic storage for Graph_g.  */
void Graph_g::makeSpace() {
	gNum = new int[M()+1];
	groups = new Dlists(M()); inGroups = new Dlists(M());
	fg = new int[n()+1]; feg = new edge[M()+1];
	split = new ListPair(n());
	deg = new int[n()+1]; gc = new int[n()+1]; gs = new int[M()+1]; 
}

void Graph_g::init() {
	for (vertex u = 0; u <= n(); u++) fg[u] = deg[u] = gc[u] = 0;
	for (edge e = 0; e <= M(); e++) gNum[e] = 0;
	for (int g = 0; g <= M(); g++) feg[g] = gs[g] = 0;
	freeGroup = 1;
	for (int g = 2; g <= M(); g++) freeGroup = inGroups->join(freeGroup,g);
}

/** Free space used by graph. */
void Graph_g::freeSpace() {
	delete [] gNum; delete groups; delete inGroups;
	delete [] fg; delete [] feg; delete split;
	delete [] deg; delete [] gc; delete [] gs;
}

/** Resize a Graph_g object.
 *  The old value is discarded.
 *  @param numv is the number of vertices to allocate space for
 *  @param maxe is the number of edges to allocate space for
 */
void Graph_g::resize(int numv, int maxe) {
	freeSpace();
	Graph::resize(numv,maxe);
	makeSpace();
	init(); 
}

/** Expand the space available for this Graph_g.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void Graph_g::expand(int numv, int maxe) {
	if (numv <= n() && maxe <= M()) return;
	Graph_g old(this->n(),this->M());
	old.copyFrom(*this);
	resize(max(numv,n()),max(maxe,M()));
	this->copyFrom(old);
}

/** Clear all edges.
 */
void Graph_g::clear() {
        while (first() != 0) {
                remove(first());
        }
	split->clear();
	inGroups->clear();
	init();
}

/** Copy into this object from source. */
void Graph_g::copyFrom(const Graph_g& source) {
	if (&source == this) return;
	if (source.n() > n() || source.m() > M())
		resize(source.n(),source.m());
	else clear();
	for (edge e = source.first(); e != 0; e = source.next(e)) {
		joinWith(source.input(e),source.output(e),
			 source.groupNumber(e),e);
	}
        sortAdjLists();
}

/** Join two vertices with an edge, assigning edge to new group.
 *  @param u is an input vertex
 *  @param v is an output vertex
 *  @returns the edge number of the new edge or 0 on failure
 */
edge Graph_g::join(vertex u, vertex v) {
	assert(freeGroup != 0);
	return join(u,v,freeGroup);
}

/** Join two vertices with an edge.
 *  @param u is an input vertex or a vertex with no edges yet;
 *  in the latter case, the join converts it to an input
 *  @param v is an output vertex
 *  @param g is the group number to be assigned to the new edge
 *  @returns the edge number of the new edge or 0 on failure
 */
edge Graph_g::join(vertex u, vertex v, int g) {
	return joinWith(u,v,g,edges->firstOut());
}

/** Join two vertices with a specified edge.
 *  @param u is an input vertex or a vertex with no edges yet;
 *  in the latter case, the join converts it to an input
 *  @param v is an output vertex
 *  @param e is the edge number to use
 *  @returns the edge number of the new edge or 0 on failure
 */
edge Graph_g::joinWith(vertex u, vertex v, edge e) {
	assert(freeGroup != 0);
	return joinWith(u,v,freeGroup,e);
}

/** Join two vertices with a specified group and edge.
 *  @param u is an input vertex or a vertex with no edges yet;
 *  in the latter case, the join converts it to an input
 *  @param v is an output vertex
 *  @param g is the group number to be assigned to the new edge
 *  @param e is the edge number to use
 *  @returns the edge number of the new edge or 0 on failure
 */
edge Graph_g::joinWith(vertex u, vertex v, int g, edge e) {
	if (deg[u] == 0 && split->isOut(u)) split->swap(u);
	assert(split->isIn(u) && split->isOut(v));
	Graph::joinWith(u,v,e);
	gNum[e] = g;
	deg[u]++; deg[v]++; gc[v]++; gs[g]++;
	if (feg[g] == 0) {
		gc[u]++; freeGroup = inGroups->remove(g,freeGroup);
	}
	feg[g] = groups->join(feg[g],e);
	if (inGroups->singleton(g)) fg[u] = inGroups->join(fg[u],g);
	return e;
}

/** Merge two edge groups.
 *  @param e1 is an edge
 *  @param e2 is a second edge with the same input vertex as e1 but belonging
 *  to a different edge group
 *  @returns the group number of the resulting edge group
 */
index Graph_g::merge(edge e1, edge e2) {
	int g1 = gNum[e1]; int g2 = gNum[e2];
	if (g1 == g2 || g2 == 0) return g1;
	if (g1 == 0) return g2;
	assert (input(e1) == input(e2));
	vertex u = input(e1);

	// note: could speed this up using Dsets data structure 
	// but since merge is only used in graph generation process,
	// not much point
	for (edge e = firstEdgeInGroup(g2); e != 0; e = nextEdgeInGroup(g2,e))
		gNum[e] = g1;
	feg[g1] = groups->join(feg[g1],feg[g2]); feg[g2] = 0;
	fg[u] = inGroups->remove(g2,fg[u]);
	freeGroup = inGroups->join(freeGroup,g2);
	gs[g1] += gs[g2]; gs[g2] = 0; gc[u]--;
	return g1;
}

/** Remove an edge from the graph.
 *  @param e is edge to be removed
 *  @return true on success
 */
bool Graph_g::remove(edge e) {
	int g = groupNumber(e);
	vertex u = input(e); vertex v = output(e);
	gNum[e] = 0; 
	deg[u]--; deg[v]--; gc[v]--; gs[g]--;
	feg[g] = groups->remove(e,feg[g]);
	if (feg[g] == 0) {
		fg[u] = inGroups->remove(g,fg[u]);
		gc[u]--; freeGroup = inGroups->join(freeGroup,g);
	}
	Graph::remove(e);
	return true;
}

Graph_g *ggpointer;

bool ggcompare(int g1, int g2) {
	return ggpointer->groupSize(g1) > ggpointer->groupSize(g2);
}

void Graph_g::sortGroups(vertex u) {
	int vec[groupCount(u)];
	vec[0] = firstGroup(u);
	int i = 1;
	while (fg[u] != 0) {
		vec[i++] = fg[u]; fg[u] = inGroups->remove(fg[u],fg[u]);
	}
	ggpointer = this;
	sort(vec, vec+groupCount(u), ggcompare);
	fg[u] = vec[0];
	for (int i = 1; i < groupCount(u); i++)
		fg[u] = inGroups->join(fg[u], vec[i]);
}

/** Read adjacency list from an input stream, add it to the graph.
 *  @param in is an open input stream
 *  @return true on success, false on error.
 */
bool Graph_g::readAdjList(istream& in) {
	if (!Util::verify(in,'[')) return false;
	vertex u;
	if (!Adt::readIndex(in,u)) return false;
	if (u > n()) expand(u,M());
	if (!Util::verify(in,':')) return false;
	while (in.good() && !Util::verify(in,']')) {
		if (!Util::verify(in,'(')) return false;
		int grp = 0;
		while (in.good() && !Util::verify(in,')')) {
			vertex v;
			if (!Adt::readIndex(in,v)) return false;
			if (v > n()) {
				expand(v,M());
			}
			if (m() == M()) {
				expand(n(),2*M());
			}
			edge e = 0;
			if (Util::verify(in,'#')) {
				if (!Util::readInt(in,e)) return false;
			}
			if (e > M()) expand(n(),e);
			if (grp == 0) {
				if (e == 0) e = join(u,v);
				else joinWith(u,v,e);
				grp = groupNumber(e);
			} else {
				if (e == 0) e = join(u,v,grp);
				else joinWith(u,v,grp,e);
			}
		}
	}
	return in.good();
}

/** Create a string representation of an edge.
 *  @param e is an edge number
 *  @return the string
 */
string Graph_g::edge2string(edge e) const {
	string s;
	vertex u = input(e); vertex v = output(e);
        s += "(" + index2string(u);
	s += "," + index2string(v) + "," + to_string(groupNumber(e)) + ")";
	if (shoEnum) s += "#" + to_string(e);
        return s;
}

/** Create a string representation of a group.
 *  @param grp is a group number
 *  @return the string
 */
string Graph_g::group2string(int grp) const {
	string s;
	s += " (";
	for (edge e = firstEdgeInGroup(grp); e!=0; e = nextEdgeInGroup(grp,e)) {
		vertex v = output(e);
		if (e != firstEdgeInGroup(grp)) s += " ";
		s += index2string(v);
	}
	s += ")";
        return s;
}

/** Create a string representation of an adjacency list.
 *  @param u is a vertex number
 *  @return the string
 */
string Graph_g::adjList2string(vertex u) const {
	string s;
	if (firstGroup(u) == 0) return s;
	int cnt = 0;
	s += "[" + Adt::index2string(u) + ":";
	for (int g = firstGroup(u); g != 0; g = nextGroup(u,g)) {
		s += " (";
		for (edge e = firstEdgeInGroup(g); e != 0;
			  e = nextEdgeInGroup(g,e)) {
			vertex v = output(e);
			if (e != firstEdgeInGroup(g)) s += " ";
			s += index2string(v);
			if (shoEnum) s += "#" + to_string(e);
			if (++cnt >= 15 && nextAt(u,e) != 0) {
				s +=  "\n"; cnt = 0;
			}
		}
		s += ")";
	}
	s +=  "]\n";
	return s;
}

/** Construct a string in dot file format representation 
 *  of the Graph_g object.
 *  For small graphs (at most 26 vertices), vertices are
 *  represented in the string as lower case letters.
 *  For larger graphs, vertices are represented by integers.
 *  @return the string
 */
string Graph_g::toDotString() const {
	string s = "graph G {\n";
	int cnt = 0;
	for (edge e = first(); e != 0; e = next(e)) {
		vertex u = min(left(e),right(e));
		vertex v = max(left(e),right(e));
		s += Adt::index2string(u) + " -- ";
		s += Adt::index2string(v);
		s += " [label = \" " + to_string(groupNumber(e))
		     + " \"] ; "; 
		if (++cnt == 10) { s += "\n"; cnt = 0; }
	}
	s += "}\n\n";
	return s;
}

} // ends namespace
