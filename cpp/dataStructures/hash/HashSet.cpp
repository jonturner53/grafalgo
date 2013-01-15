/** @file HashSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "HashSet.h"

namespace grafalgo {

/** Constructor for HashSet, allocates space and initializes set.
 *  N1 is the target number of elements in the table; the table
 *  is dimensioned for a load of no more than 0.5.
 */
HashSet::HashSet(int n1) : Adt(n1) { makeSpace(n()); }
	
/** Destructor for HashSet. */
HashSet::~HashSet() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void HashSet::makeSpace(int size) {
	for (nb = 1; BKT_SIZ*nb <= size; nb <<= 1) {}
	nb = max(nb,4);
	bktMsk = nb - 1;
	nn = 2*nb*BKT_SIZ+1;
	try {
		bkt = new bkt_t[2*nb];
		ex = new SetPair(n());
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "HashSet::makeSpace: insufficient space for "
		   << size << " values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	clear();
}

/** Free dynamic storage used by list. */
void HashSet::freeSpace() { delete [] bkt; }

/** Resize a HashSet object, discarding old contents.
 *  @param size is the size of the resized object.
 */
void HashSet::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "HashSet::resize:" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this HashSet.
 *  Rebuilds old value in new space. This operation
 *  changes the index values assigned to each element.
 *  @param size is the size of the resized object.
 */
void HashSet::expand(int size) {
	if (size <= n()) return;
	HashSet old(ex->getNumIn()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the set contents. */
void HashSet::clear() {
	while (first() != 0) remove(val(first()));
}

/** Copy into this from source. */
void HashSet::copyFrom(const HashSet& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (index x = source.first(); x != 0; x = source.next(x)) 
		insert(source.val(x));
}

/** Compute a bucket index for a given val.
 * 
 *  Hashit uses multiplicative hashing with one of two
 *  different multipliers, after first converting
 *  the 64 bit integer into a 32 bit integer.
 *
 *  @param val is the value to be hashed
 *  @param hf is either 0 or 1 and selects one of two hash functions
 *  @return b return the index of the bucket that val hashes to
 */
uint32_t HashSet::hashit(int64_t val, int hf) const {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint32_t x, y; uint64_t z;

	x = (val >> 16) & 0xffff0000; x |= (val & 0xffff);
	y = (val >> 48) & 0xffff; y |= (val & 0xffff0000); 
	z = x ^ y;
	z *= (hf == 0 ? A0 : A1);
	return (z >> 16) & bktMsk;
}

/** Perform a lookup in the set.
 *  @param val is the value to be looked up in the table
 *  @return the index assigned to val or 0 if not in set
 */
index HashSet::getIndex(int64_t val) const {
	int i; uint32_t b;

	// check bucket in the first half of the bucket array
	b = hashit(val,0); int x = b*BKT_SIZ+1;
	for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isIn(x) && bkt[b][i] == val) return x;
		x++;
        }

	// check bucket in the second half of the bucket array
        b = nb + hashit(val,1); x = b*BKT_SIZ+1;
        for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isIn(x) && bkt[b][i] == val) return x;
		x++;
        }
	return 0;
}

/** Insert a value into the set.
 *  If the value is already in the set, no change is made.
 *  @param val is the value to insert
 *  @return the index assigned to val on success, 0 on failure.
 */
index HashSet::insert(int64_t val) {
	int i, j0, j1, n0, n1;
	uint32_t b0, b1;

	// Count the number of unused items in each bucket
	// and find an unused item in each (if there is one)
	// quit early if we already have an entry for this val
	b0 = hashit(val,0);
	j0 = n0 = 0; int x = b0*BKT_SIZ+1;
	for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isOut(x)) { n0++; j0 = i; }
		else if (bkt[b0][i] == val) return x;
		x++;
	}
	b1 = nb + hashit(val,1);
	j1 = n1 = 0; x = b1*BKT_SIZ+1;
	for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isOut(x)) { n1++; j1 = i; }
		else if (bkt[b1][i] == val) return x;
		x++;
	}
	// if no unused entry in either bucket, give up.
	if (n0 + n1 == 0) return false;

	// store the value in least-loaded bucket
	if (n0 >= n1) {
		bkt[b0][j0] = val; x = b0*BKT_SIZ+j0+1;
	} else {
		bkt[b1][j1] = val; x = b1*BKT_SIZ+j1+1;
	}
	ex->swap(x);
	return x;
}

/** Remove a value from the set.
 *  @param val is the value of the pair to be removed
 */
void HashSet::remove(int64_t val) {
	int i; uint32_t b;

	b = hashit(val,0); int x = b*BKT_SIZ+1;
	for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isIn(x) && bkt[b][i] == val) {
			ex->swap(x); return;
		}
		x++;
	}
	b = nb + hashit(val,1); x = b*BKT_SIZ+1;
	for (i = 0; i < BKT_SIZ; i++) {
		if (ex->isIn(x) && bkt[b][i] == val) {
			ex->swap(x); return;
		}
		x++;
	}
}

/** Create a string representation of the set.
 *  @param s is a reference to a string in whcih result is returned
 *  @return a reference to s
 */ 
string& HashSet::toString(string& s) const {
	stringstream ss;
	ss << "{";
	for (index x = first(); x != 0; x = next(x)) {
		if (x != first()) ss << " ";
		ss << bkt[(x-1)/BKT_SIZ][(x-1)%BKT_SIZ];
	}
	ss << "}";
	s = ss.str();
	return s;
}

} // ends namespace
