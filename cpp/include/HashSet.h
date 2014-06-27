/** \file HashSet.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
  

#ifndef HASHSET_H
#define HASHSET_H

#include "Adt.h"
#include "ListPair.h"

namespace grafalgo {

/** Data structure that maintains a set of elements.
 *  In addition to the usual set operations, the data structure
 *  assigns a unique index to each element and provides methods
 *  to access set elements by their index.
 */
template<class E> class HashSet : public Adt {
public:
		HashSet(uint32_t (*)(const E&, int), int=26);
		~HashSet();

	// common methods
	void	clear();
	void	resize(int);
	void	expand(int);
	void	copyFrom(const HashSet&);

	// access methods
	index	first() const; 	
	index	next(index) const; 	
	index	find(const E&) const; 		
	const E& retrieve(index) const;
	int	size() const;

	// add/remove elements
	index	insert(const E&); 
	index	insert(const E&, int); 
	void	remove(const E&); 

	// predicates
	bool	contains(const E&) const;
	bool	valid(index) const;

	// produce human-readable version
	string 	toString() const;
protected:
	uint32_t (*hashit)(const E&, int); ///< pointer to hash function
private:
	static const int MAXINDEX = (1 << 24)-1;  ///< largest possible index
	static const int BKT_SIZ = 8;   ///< # of entries per bucket
	static const int LG_BKT_SIZ = 3; ///< log2(BKT_SIZ)
	typedef uint32_t bkt_t[BKT_SIZ]; ///< bucket type

	int     nb;		///< # of buckets in each half
	uint32_t bktMsk;	///< mask used to extract bucket number
	uint32_t fpMsk;		///< mask used to extract fingerprint
	uint32_t indexMsk;	///< mask used to extract index value
	bkt_t   *bkt;		///< buckets for hash table
	ListPair *idx;	  	///< used to track in-use/free indexes

	E	*eVec;		///< eVec[i] is element mapped to index i


	void	makeSpace(int);
	void	freeSpace();
};

/** Constructor for HashSet, allocates space and initializes table.
 *  N1 is the limit on the range of values; it must be less than 2^24.
 */
template<class E>
HashSet<E>::HashSet(uint32_t (*h)(const E&, int), int n1)
	: Adt(n1), hashit(h) {
	makeSpace(n());
};
	
/** Destructor for HashSet. */
template<class E>
HashSet<E>::~HashSet() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
template<class E>
void HashSet<E>::makeSpace(int size) {
	// determine number of buckets - keep max load factor in [1/3,2/3]
	for (nb = 1; size >= (2*BKT_SIZ*nb)*2/3; nb <<= 1) {}
	nb = max(nb,4);
	// set masks for bucket, index and fingerprint
	bktMsk = nb - 1; indexMsk = (2*BKT_SIZ*nb) - 1; fpMsk = ~indexMsk;
	try {
		bkt = new bkt_t[2*nb];
		eVec = new E[size+1];
		idx = new ListPair(size);
	} catch (std::bad_alloc e) {
		string s = "HashSet::makeSpace: insufficient space for "
		   	 + to_string(size) + " entries";
		throw OutOfSpaceException(s);
	}
	for (int b = 0; b < 2*nb; b++) {
		for (int i = 0; i < BKT_SIZ; i++) bkt[b][i] = 0;
	}
	nn = size;
}

/** Free dynamic storage used by list. */
template<class E>
void HashSet<E>::freeSpace() { delete [] bkt; delete idx; }

/** Resize a HashSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
template<class E>
void HashSet<E>::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "HashSet::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this HashSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class E>
void HashSet<E>::expand(int size) {
	if (size <= n()) return;
	HashSet old(hashit, this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Remove all elements from map. */
template<class E>
void HashSet<E>::clear() {
	while (first() != 0) remove(retrieve(first()));
}

/** Copy into this from source. */
template<class E>
void HashSet<E>::copyFrom(const HashSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.first(); x != 0; x = source.next(x))
		insert(source.retrieve(x),x);
}

/** Get the first assigned index, in some arbitrary order.
 *  @return number of the first identfier
 */
template<class E>
inline int HashSet<E>::first() const { return idx->firstIn(); }

/** Get the next assigned index, in some arbitrary order.
 *  @param id is an identifer in the set
 *  @return number of the next identfier
 */
template<class E>
inline int HashSet<E>::next(int id) const { return idx->nextIn(id); }

/** Determine if a given element is in the set.
 *  @param elem is the element to be checked
 *  @return true if the element has been mapped, else false
 */
template<class E>
inline bool HashSet<E>::contains(const E& elem) const { return find(elem) != 0; }

/** Determine if a given index has been assigned to a element.
 *  @param x is the index to be checked
 *  @return true if the index has been asssigned, else false
 */
template<class E>
inline bool HashSet<E>::valid(int x) const { return idx->isIn(x); }

/** The size of the mapping.
 *  @return the number of mapped index values.
 */
template<class E>
inline int HashSet<E>::size() const { return idx->getNumIn(); }

/** Retrieve the element with a given index.
 *  @param x is the index whose element is to be returned
 *  @return the element that maps to x, or 0 if there is none
 */
template<class E>
inline const E& HashSet<E>::retrieve(index x) const {
	if (!valid(x)) {
		string s = "HashSet::retrieve: invalid index " + to_string(x);
		throw IllegalArgumentException(s);
	}
	return eVec[x]; 
}

/** Get the index for a given element.
 *  @param elem is the element for which the id is required
 *  @return the corresponding id or 0 if the element is not
 *  in the set or the operation fails
 */
template<class E>
int HashSet<E>::find(const E& elem) const {
	index x;
	// check bucket in the first half of the bucket array
	uint32_t h = hashit(elem,0);
	uint32_t b = h & bktMsk;
	uint32_t fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) return x;
		}
	}
	// check bucket in the second half of the bucket array
	h = hashit(elem,1);
	b = nb + (h & bktMsk); fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) return x;
		}
	}
	return 0;
}


/** Add a new element to the set.
 *  @param elem is the element to be added
 *  @return the index assigned to the element or 0 if the operation fails;
 *  if the element is already in the set, a new index is assigned
 */
template<class E>
inline index HashSet<E>::insert(const E& elem) {
	index x = idx->firstOut();
	if (x == 0) {
		expand(2*n());
		x = idx->firstOut();
	}
	return insert(elem,x);
}

/** Insert a new element.
 *  @param element is the new element
 *  @param x is the index to be assigned to the element
 *  @return the new index or 0 if x is not an available index or
 *  the operation fails; if the element is already in use, the specified
 *  index replaces the index that the element was previosly assigned
 *  to the element
 */
template<class E>
index HashSet<E>::insert(const E& elem, index x) {
	if (!idx->isOut(x)) return 0;
	idx->swap(x);

	// find an empty slot in buckets in both halves of hash table,
	// count number of empty slots, if element already present, overwrite
	uint32_t h0 = hashit(elem,0);
	uint32_t b0 = h0 & bktMsk;
	uint32_t fp0 = (h0 << (LG_BKT_SIZ-1)) & fpMsk;
	int i0, n0; i0 = n0 = 0;
	for (int i = BKT_SIZ-1; i >= 0; i--) {
		if (bkt[b0][i] == 0) { n0++; i0 = i; }
		else if ((bkt[b0][i] & fpMsk) == fp0) {
			uint32_t oldIndex = bkt[b0][i] & indexMsk;
			if (eVec[oldIndex] == elem) {
				bkt[b0][i] = fp0 | (x & indexMsk);
				eVec[x] = elem;
				idx->swap(oldIndex);
				return x;
			}
		}
	}
	uint32_t h1 = hashit(elem,1);
	uint32_t b1 = nb + (h1 & bktMsk);
	uint32_t fp1 = (h1 << (LG_BKT_SIZ-1)) & fpMsk;
	int i1, n1; i1 = n1 = 0;
	for (int i = BKT_SIZ-1; i >= 0; i--) {
		if (bkt[b1][i] == 0) { n1++; i1 = i; }
		else if ((bkt[b1][i] & fpMsk) == fp1) {
			uint32_t oldIndex = bkt[b1][i] & indexMsk;
			if (eVec[oldIndex] == elem) {
				bkt[b1][i] = fp1 | (x & indexMsk);
				eVec[x] = elem;
				idx->swap(oldIndex);
				return x;
			}
		}
	}
	// if no unused entry in either bucket, give up
	if (n0 + n1 == 0) return 0;

	// store the element in eVec and add entry in least-loaded bucket
	eVec[x] = elem;
	if (n0 >= n1) {
		bkt[b0][i0] = fp0 | (x & indexMsk);
	} else {
		bkt[b1][i1] = fp1 | (x & indexMsk);
	}
		
	return x;
}

/** Remove a set element.
 *  This operation removes an element from the set.
 *  @param elem is the element of the pair to be removed
 */
template<class E>
void HashSet<E>::remove(const E& elem) {
	index x;
	// check bucket in the first half of the bucket array
	uint32_t h = hashit(elem,0);
	uint32_t b = h & bktMsk; uint32_t fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) {
				bkt[b][i] = 0; idx->swap(x); return;
			}
		}
	}
	// check bucket in the second half of the bucket array
	h = hashit(elem,1);
	b = nb + (h & bktMsk); fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) {
				bkt[b][i] = 0; idx->swap(x); return;
			}
		}
	}
}

/** Create a string representation of the HashSet.
 *  @return the string
 */
template<class E>
string HashSet<E>::toString() const {
	stringstream ss; ss << "{";
	for (index x = first(); x != 0; x = next(x)) {
		if (x != first()) ss << " ";
		ss << "(" << retrieve(x) << "," << x << ")";
	}	
	ss << "}"; return ss.str();
}

} // ends namespace

#endif
