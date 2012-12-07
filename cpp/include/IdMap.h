/** \file IdMap.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
  

#ifndef IDSET_H
#define IDSET_H

#include "stdinc.h"

#include "Adt.h"
#include "HashSet.h"

namespace grafalgo {

/** Data structure that assigns small integer identifiers to large keys.
 *  This is useful in contexts where the "natural identifiers"
 *  in an application can vary over a large range, but the number
 *  of distinct identifiers that are in use at one time is relatively
 *  small. This data structure can be used to map the "natural identfiers"
 *  into integers in a restricted range 1..max, where max is specified
 *  when the data structure is initialized.
 */
class IdMap : public Adt {
public:
		IdMap(int);
		~IdMap();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const IdMap&);

	// access methods
	int	firstId() const; 	
	int	nextId(int) const; 	
	int	size() const;
	int	getId(uint64_t) const; 		
	uint64_t getKey(int) const;

	// define/retrieve/remove (key,id) pairs
	int	addPair(uint64_t); 
	int	addPair(uint64_t,int); 
	void	dropPair(uint64_t); 

	// predicates
	bool	validKey(uint64_t) const;
	bool	validId(int) const;

	// produce readable IdMaps
	string&	toString(string&) const;
private:
	static const int MAXID = (1 << 20)-1;  ///< largest possible identifier
	HashSet *hset;

	void	makeSpace(int);
	void	freeSpace();
};

/** Get the first assigned identifier, in some arbitrary order.
 *  @return number of the first identfier
 */
inline int IdMap::firstId() const { return hset->first(); }

/** Get the next assigned identifier, in some arbitrary order.
 *  @param id is an identifer in the set
 *  @return number of the next identfier
 */
inline int IdMap::nextId(int id) const { return hset->next(id); }

/** Determine if a given key has been mapped to an identfier.
 *  @param key is the key to be checked
 *  @return true if the key has been mapped, else false
 */
inline bool IdMap::validKey(uint64_t key) const { return hset->member(key); }

/** Determine if a given identifier has been assigned to a key.
 *  @param id is the identifier to be checked
 *  @return true if the key has been mapped, else false
 */
inline bool IdMap::validId(int id) const { return hset->isValid(id); }

/** The size of the mapping.
 *  @return the number of mapped identifiers.
 */
inline int IdMap::size() const { return hset->size(); }

/** Get the id for a given key.
 *  @param key is the key for which the id is required
 *  @return the corresponding id or 0 if the key is not
 *  mapped or the operation fails
 */
inline int IdMap::getId(uint64_t key) const { return hset->getIndex(key); }

/** Get the key that was mapped to the given identifier
 *  @param id is the identifier whose key is to be returned
 *  @return the key that maps to id, or 0 if there is none
 */
inline uint64_t IdMap::getKey(int id) const {
	return (validId(id) ? hset->val(id) : 0); 
}

} // ends namespace

#endif
