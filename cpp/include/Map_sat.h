/** \file Map_sat.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef MAP_SAT_H
#define MAP_SAT_H

#include "stdinc.h"
#include "Ssets_sat.h"
#include "ListPair.h"

namespace grafalgo {

/** Maintains set of (key, value) pairs where key is a 64 bit value and
 *  value is a positive 32 bit integer. All keys must be distinct.
 * 
 *  Main methods
 *    get - returns value for given key
 *    put - adds a (key,value) pair
 *    remove - removes the pair for a given key
 * 
 *  The implementation uses a balanced binary search tree.
 */
class Map_sat : public Adt {
public:
		Map_sat(int);
		~Map_sat();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const Map_sat&);

	void	init() { root = 0; }
	int	get(keytyp); 		
	bool	put(keytyp, uint32_t); 
	void	remove(keytyp); 	

	string& toString(string&) const;
	string  toString() const;
private:
	static const int UNDEF_VAL = INT_MIN;   ///< undefined value
	bst	root;			///< root of search tree
	Ssets_sat *st;			///< search tree storing keys
	uint32_t *values;		///< vector of values
	ListPair *nodes;		///< in-use and free nodes

	void	makeSpace();
	void	freeSpace();
};

} // ends namespace

#endif
