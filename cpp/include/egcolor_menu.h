/** @file egcolor_menu.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGCOLOR_MENU_H
#define EGCOLOR_MENU_H

#include "Graph_g.h"
#include "dmatch.h"
#include "egcolor.h"

namespace grafalgo {

/** This class is the base class for the "menu" method for
 *  edge group coloring in a bipartite graph. This method
 *  assigns a menu of colors to each group, then colors the
 *  edges incident to each output by finding a matching in
 *  an associated menu graph.
 *
 *  Each specific algorithm is invoked using the constructor
 *  for its subclass.
 */
class egcolor_menu : public egcolor {
public:
	egcolor_menu(Graph_g&, int*);
	~egcolor_menu();

	Dlists **menus;	// menus[u] defines menus for groups at input u
	int	*fc;		// fc[grp] is first color in grp's menu
	Graph **mgraf;		// *mgraf[v]: menu graph for v
	int	*gx;		// gx[e] is group index for e
	dmatch **dymatch;	// dymatch[v] maintains matching on mgraf[v]

	int	firstColor(int) const;
	int	nextColor(int, int) const;
	bool	inMenu(int, int) const;
	int	menuSize(int) const;

	void	addColor(int, int);
	void	removeColor(int, int);
	void	clearMenus();

	int	deficit(int);
	int	value(int, int);
	int	gain(int, int);

	int	growMenu(int, int);
	int	shrinkMenu(int, int);
	void	resetMenu(int);
	int	swapOut(int);

	bool	isConsistent(vertex) const;
};

inline int egcolor_menu::firstColor(int grp) const {
	return fc[grp];
}

inline int egcolor_menu::nextColor(int grp, int c) const {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return 0;
	int x = menus[gp->input(e)]->next(c);
	return (x == fc[grp] ? 0 : x);
}


} // ends namespace

#endif
