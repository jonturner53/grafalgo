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
template<class E, uint32_t (*)(const E&, int)>
class HashSet : public Adt {
public:
		HashSet(int=10, bool=true);
		HashSet(const HashSet&);
		HashSet(HashSet&&);
		~HashSet();

	// operators
	HashSet& operator=(const HashSet&);
	HashSet& operator=(HashSet&&);

	// adjust size
	void	resize(int);
	void	expand(int);

	// predicates
	bool	empty() const; 		
	bool	contains(const E&) const;
	bool	valid(index) const;

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
	void	clear();

	// produce human-readable version
	string 	toString() const;
protected:
	bool	autoExpand;
	int	numBuckets();
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

	void	makeSpace();
	void	freeSpace();
	void	init();
};

/** Constructor for HashSet, allocates space and initializes table.
 *  @param h is a pointer to the hash function to b used
 *  @param n1 is an optional limit on the range of values;
 *  it must be less than 2^24; the default is 10
 *  @param autoX is an optional parameter that determines whether the
 *  the data structure expands automatically, as needed; the default
 *  value is true
 */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>::HashSet(int n1, bool autoX) : Adt(n1), autoExpand(autoX) {
	nb = numBuckets(); makeSpace(); init();
};

/** Copy constructor.
 */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>::HashSet(const HashSet& src) : Adt(src.n()) {
	autoExpand = src.autoExpand;
	nb = src.nb;
	makeSpace();
	bktMsk = src.bktMsk; fpMsk = src.fpMsk; indexMsk = src.indexMsk;
	for (int b = 0; b < 2*nb; b++) {
		for (int i = 0; i < BKT_SIZ; i++)
			bkt[b][i] = src.bkt[b][i];
	}
	for (index x = src.first(); x != 0; x = src.next(x))
		eVec[x] = src.eVec[x];
	*idx = *(src.idx);
}

/** Move constructor.
 */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>::HashSet(HashSet&& src) : Adt(src.n()) {
	autoExpand = src.autoExpand;
	nb = src.nb;
	bktMsk = src.bktMsk; fpMsk = src.fpMsk; indexMsk = src.indexMsk;

	bkt = src.bkt; src.bkt = nullptr;
	eVec = src.eVec; src.eVec = nullptr;
	idx = src.idx; src.idx = nullptr;
};
	
/** Destructor for HashSet. */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>::~HashSet() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::makeSpace() {
	nb = numBuckets();
	bkt = new bkt_t[2*nb]; eVec = new E[n()+1]; idx = new ListPair(n());
}

/** Free dynamic storage used by list. */
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::freeSpace() { delete [] bkt; delete idx; }

template<class E, uint32_t (*H)(const E&, int)>
int HashSet<E,H>::numBuckets() {
	int k;
	for (k = 1; n() > (2*BKT_SIZ*k)*2/3; k <<= 1) {}
	return k;
}

template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::init() {
	// set masks for bucket, index and fingerprint
	bktMsk = nb - 1; indexMsk = (2*BKT_SIZ*nb) - 1; fpMsk = ~indexMsk;
	for (int b = 0; b < 2*nb; b++) {
		for (int i = 0; i < BKT_SIZ; i++) bkt[b][i] = 0;
	}
}

/** Assignment operator (copy version)
 */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>& HashSet<E,H>::operator=(const HashSet& src) {
	if (this == &src) return *this;
	if (src.n() > n() || src.nb != nb) resize(src.n());
	autoExpand = src.autoExpand;
	bktMsk = src.bktMsk; fpMsk = src.fpMsk; indexMsk = src.indexMsk;
	for (int b = 0; b < 2*nb; b++) {
		for (int i = 0; i < BKT_SIZ; i++)
			bkt[b][i] = src.bkt[b][i];
	}
	idx->clear();
	for (index x = src.first(); x != 0; x = src.next(x)) {
		eVec[x] = src.eVec[x]; idx->swap(x);
	}
	return *this;
}

/** Assignment operator (move version)
 */
template<class E, uint32_t (*H)(const E&, int)>
HashSet<E,H>& HashSet<E,H>::operator=(HashSet&& src) {
	if (this == &src) return *this;
	freeSpace(); Adt::resize(src.n());
	autoExpand = src.autoExpand; nb = src.nb;
	bktMsk = src.bktMsk; fpMsk = src.fpMsk; indexMsk = src.indexMsk;

	bkt = src.bkt; src.bkt = nullptr;
	eVec = src.eVec; src.eVec = nullptr;
	idx = src.idx; src.idx = nullptr;
	return *this;
};

/** Resize a HashSet object.
 *  The old value is discarded.
 *  @param size is the size of the resized object.
 */
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::resize(int size) {
	freeSpace(); Adt::resize(size); nb = numBuckets(); makeSpace(); init();
}

/** Expand the space available for this HashSet.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::expand(int size) {
	if (size <= n()) return;
	delete [] bkt; auto old_eVec = eVec; auto old_idx = idx;
	Adt::resize(size); nb = numBuckets();
	bkt = new bkt_t[2*nb]; eVec = new E[n()+1]; idx = new ListPair(n());
	init();
	for (index x = old_idx->firstIn(); x != 0; x = old_idx->nextIn(x))
		insert(old_eVec[x],x);
	delete [] old_eVec; delete old_idx;
}

/** Get the first assigned index, in some arbitrary order.
 *  @return number of the first identfier
 */
template<class E, uint32_t (*H)(const E&, int)>
inline int HashSet<E,H>::first() const { return idx->firstIn(); }

/** Get the next assigned index, in some arbitrary order.
 *  @param id is an identifer in the set
 *  @return number of the next identfier
 */
template<class E, uint32_t (*H)(const E&, int)>
inline int HashSet<E,H>::next(int id) const { return idx->nextIn(id); }

/** Determine if a set is empty.
 *  @param elem is the element to be checked
 *  @return true if the element has been mapped, else false
 */
template<class E, uint32_t (*H)(const E&, int)>
inline bool HashSet<E,H>::empty() const { return size() == 0; }

/** Determine if a given element is in the set.
 *  @param elem is the element to be checked
 *  @return true if the element has been mapped, else false
 */
template<class E, uint32_t (*H)(const E&, int)>
inline bool HashSet<E,H>::contains(const E& elem) const { return find(elem)!=0; }

/** Determine if a given index has been assigned to a element.
 *  @param x is the index to be checked
 *  @return true if the index has been asssigned, else false
 */
template<class E, uint32_t (*H)(const E&, int)>
inline bool HashSet<E,H>::valid(int x) const { return idx->isIn(x); }

/** The size of the mapping.
 *  @return the number of mapped index values.
 */
template<class E, uint32_t (*H)(const E&, int)>
inline int HashSet<E,H>::size() const { return idx->getNumIn(); }

/** Retrieve the element with a given index.
 *  @param x is the index whose element is to be returned
 *  @return the element that maps to x, or 0 if there is none
 */
template<class E, uint32_t (*H)(const E&, int)>
inline const E& HashSet<E,H>::retrieve(index x) const {
	assert(valid(x));
	return eVec[x]; 
}

/** Get the index for a given element.
 *  @param elem is the element for which the id is required
 *  @return the corresponding id or 0 if the element is not
 *  in the set or the operation fails
 */
template<class E, uint32_t (*H)(const E&, int)>
int HashSet<E,H>::find(const E& elem) const {
	index x;
	// check bucket in the first half of the bucket array
	uint32_t h = H(elem,0);
	uint32_t b = h & bktMsk;
	uint32_t fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) return x;
		}
	}
	// check bucket in the second half of the bucket array
	h = H(elem,1);
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
 *  @return the index assigned to the element or 0 if the operation fails
 */
template<class E, uint32_t (*H)(const E&, int)>
inline index HashSet<E,H>::insert(const E& elem) {
	// count number of empty slots, in both halves of the table
	// if element already present, return its index
	uint32_t h0 = H(elem,0);
	uint32_t b0 = h0 & bktMsk;
	uint32_t fp0 = (h0 << (LG_BKT_SIZ-1)) & fpMsk;
	int i0, n0; i0 = n0 = 0;
	for (int i = BKT_SIZ-1; i >= 0; i--) {
		if (bkt[b0][i] == 0) { n0++; i0 = i; }
		else if ((bkt[b0][i] & fpMsk) == fp0) {
			index x = bkt[b0][i] & indexMsk;
			if (eVec[x] == elem) return x;
		}
	}
	uint32_t h1 = H(elem,1);
	uint32_t b1 = nb + (h1 & bktMsk);
	uint32_t fp1 = (h1 << (LG_BKT_SIZ-1)) & fpMsk;
	int i1, n1; i1 = n1 = 0;
	for (int i = BKT_SIZ-1; i >= 0; i--) {
		if (bkt[b1][i] == 0) { n1++; i1 = i; }
		else if ((bkt[b1][i] & fpMsk) == fp1) {
			index x = bkt[b1][i] & indexMsk;
			if (eVec[x] == elem) return x;
		}
	}

	// if no unused entry in either bucket, give up
	if (n0 + n1 == 0) return 0;

	// store the element in eVec and add entry in least-loaded bucket
	index x = idx->firstOut();
	if (x == 0) {
		if (autoExpand) expand(2*n());
		else return 0;
		x = idx->firstOut();
		insert(elem,x);
		return x;
	}
	idx->swap(x);
	eVec[x] = elem;
	if (n0 >= n1) {
		bkt[b0][i0] = fp0 | (x & indexMsk);
	} else {
		bkt[b1][i1] = fp1 | (x & indexMsk);
	}

	return x;

}

/** Insert a new element.
 *  @param element is the new element
 *  @param x is the index to be assigned to the element
 *  @return the new index or 0 if x is not an available index or
 *  the operation fails; if the element is already in the set using a
 *  different index, the specified index replaces the one that was
 *  previously assigned to the element
 */
template<class E, uint32_t (*H)(const E&, int)>
index HashSet<E,H>::insert(const E& elem, index x) {
	if (idx->isIn(x) && elem == eVec[x]) return x;
	if (x > n()) {
		if (autoExpand) expand(max(x,2*n()));
		else return 0;
	}
	if (!idx->isOut(x)) return 0;
	idx->swap(x);

	// find an empty slot in buckets in both halves of hash table,
	// count number of empty slots, if element already present, overwrite
	uint32_t h0 = H(elem,0);
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
	uint32_t h1 = H(elem,1);
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
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::remove(const E& elem) {
	index x;
	// check bucket in the first half of the bucket array
	uint32_t h = H(elem,0);
	uint32_t b = h & bktMsk; uint32_t fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) {
				bkt[b][i] = 0; idx->swap(x);
				// shrink empty set to default size
				if (size() == 0 && autoExpand) resize(10);
				return;
			}
		}
	}
	// check bucket in the second half of the bucket array
	h = H(elem,1);
	b = nb + (h & bktMsk); fp = (h << (LG_BKT_SIZ-1)) & fpMsk;
	for (int i = 0; i < BKT_SIZ; i++) {
		if (bkt[b][i] != 0 && (bkt[b][i] & fpMsk) == fp) {
			x = bkt[b][i] & indexMsk;
			if (eVec[x] == elem) {
				bkt[b][i] = 0; idx->swap(x);
				// shrink empty set to default size
				if (size() == 0 && autoExpand) resize(10);
				return;
			}
		}
	}
}

/** Remove all elements from map. */
template<class E, uint32_t (*H)(const E&, int)>
void HashSet<E,H>::clear() {
	while (first() != 0) remove(retrieve(first()));
}

/** Create a string representation of the HashSet.
 *  @return the string
 */
template<class E, uint32_t (*H)(const E&, int)>
string HashSet<E,H>::toString() const {
	stringstream ss; ss << "{";
	for (index x = first(); x != 0; x = next(x)) {
		if (x != first()) ss << " ";
		const E& elem = retrieve(x);
		ss << "(" << elem << "," << x << ")";
	}	
	ss << "}"; return ss.str();
}

} // ends namespace

#endif
