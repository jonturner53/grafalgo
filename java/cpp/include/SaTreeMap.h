/** \file SaTreeMap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef SATREEMAP_H
#define SATREEMAP_H

#include "stdinc.h"
#include "SelfAdjBsts.h"
#include "UiSetPair.h"

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
class SaTreeMap {
public:
		SaTreeMap(int);
		~SaTreeMap();

	int	get(keytyp); 		
	bool	put(keytyp, uint32_t); 
	void	remove(keytyp); 	
	void	clear(); 	
	string& toString(string&) const;
private:
	static const int UNDEF_VAL = INT_MIN;   ///< undefined value
	int	n;			///< max number of pairs in map
	sset	root;			///< root of search tree
	SelfAdjBsts *st;		///< search tree storing keys
	uint32_t *values;		///< vector of values
	UiSetPair *nodes;		///< in-use and free nodes
};

#endif
