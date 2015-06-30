/** @file egMenu.h
 * 
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef EGMENU_H
#define EGMENU_H

#include "GroupGraph.h"
#include "egColor.h"

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
class egMenu : public egColor {
public:
	egMenu(GroupGraph&, int*);
	~egMenu();

	ClistSet *menus;	// menus[u] defines menus for groups at input u
	int	*fc;		// fc[grp] is first color in grp's menu

	int	firstColor(int);
	int	nextColor(int, int);
	void	addColor(int, int);
	void	removeColor(int, int);
	void	clearMenus();
	void	menuGraf(int, Graph&, int*);
};

inline int egMenu::firstColor(int grp) {
	return fc[grp];
}

inline int egMenu::nextColor(int grp, int c) {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return 0;
	int x = menus[gp->input(e)].next(c);
	return (x == fc[grp] ? 0 : x);
}

inline void egMenu::addColor(int c, int grp) {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return;
	if (fc[grp] == 0) {
		fc[grp] = c;
	} else {
		menus[gp->input(e)].join(c,fc[grp]);
	}
}

inline void egMenu::removeColor(int c, int grp) {
	edge e = gp->firstEdgeInGroup(grp);
	if (e == 0) return;
	vertex u = gp->input(e);
	if (fc[grp] == c) fc[grp] = menus[u].next(c);
	if (fc[grp] == c) fc[grp] = 0;
	else menus[u].remove(c);
}

inline void egMenu::clearMenus() {
	for (vertex u = 1; u <= gp->n(); u++) {
		for (int grp = gp->firstGroup(u); gp != 0;
			 grp = gp->nextGroup(u,grp)) {
			int c0 = fc[grp];
			int c = menus[u].next(c0);
			while (c != c0) {
				menus[u].remove(c); c = menus[u].next(c0);
			}
			fc[grp] = 0;
		}
	}
}

} // ends namespace

#endif
