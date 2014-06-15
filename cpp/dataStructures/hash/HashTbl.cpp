/** @file HashTbl.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "HashTbl.h"

namespace grafalgo {

/** Constructor for hashTbl, allocates space and initializes table.
 *  N1 is the limit on the range of values; it must be less than 2^20.
 */
HashTbl::HashTbl(int n1) : Adt(n1) { makeSpace(n()); }
	
/** Destructor for HashTbl. */
HashTbl::~HashTbl() { freeSpace(); }

/** Allocate and initialize space for list.
 *  @param size is number of index values to provide space for
 */
void HashTbl::makeSpace(int size) {
	if (size > MAXVAL) {
		string s = "HashTbl::makeSpace: requested table size "
			   "exceeds limit";
		throw IllegalArgumentException(s);
	}
	for (nb = 1; 8*nb <= size; nb <<= 1) {}
	nb = max(nb,4);
	bktMsk = nb - 1; valMsk = (8*nb) - 1; fpMsk = ~valMsk;
	try {
		bkt = new bkt_t[2*nb]; keyVec = new uint64_t[size+1];
	} catch (std::bad_alloc e) {
		string s = "HashTbl::makeSpace: insufficient space for "
		   	   + to_string(size) + "index values";
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by list. */
void HashTbl::freeSpace() { delete [] bkt; delete [] keyVec; }

/** Resize a HashTbl object, discarding old contents.
 *  @param size is the size of the resized object.
 */
void HashTbl::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s = "HashTbl::resize:" + e.toString();
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this HashTbl.
 *  Rebuilds old value in new space.
 *  @param size is the size of the resized object.
 */
void HashTbl::expand(int size) {
	if (size <= n()) return;
	HashTbl old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Clear the hashtable contents. */
void HashTbl::clear() {
	for (int i = 0; i < 2*nb; i++) {
		for (int j = 0; j < BKT_SIZ; j++) bkt[i][j] = 0;
	}
	for (int i = 0; i < n(); i++) keyVec[i] = 0;
	siz = 0;
}

/** Copy into this from source. */
void HashTbl::copyFrom(const HashTbl& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();
	for (int i = 0; i < source.n(); i++) insert(source.keyVec[i],i);
}

/** Compute a bucket index and fingerprint, for a given key.
 * 
 *  Hashit uses multiplicative hashing with one of two
 *  different multipliers, after first converting
 *  the 64 bit integer into a 32 bit integer.
 *
 *  @param key is the key to be hashed
 *  @param hf is either 0 or 1 and selects one of two hash functions
 *  @param b is a reference; on return its value is equal to the
 *  hash bucket for the given key
 *  @param fp is a reference; on return its value is equal to the
 *  fingerprint for the given key
 */
void HashTbl::hashit(uint64_t key, int hf, uint32_t& b, uint32_t& fp) const {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint32_t x, y; uint64_t z;

	x = (key >> 16) & 0xffff0000; x |= (key & 0xffff);
	y = (key >> 48) & 0xffff; y |= (key & 0xffff0000); 
	z = x ^ y;
	z *= (hf == 0 ? A0 : A1);
	b = (z >> 16) & bktMsk;
	fp  = (z >> 13) & fpMsk;
}

/** Perform a lookup in the hash table.
 *  @param key is the key to be looked up in the table
 *  @return the value stored for the given key, or 0 if there is none.
 */
int HashTbl::lookup(uint64_t key) const {
	int i; uint32_t b, val, fp;

	// check bucket in the first half of the bucket array
	hashit(key,0,b,fp);
	for (i = 0; i < BKT_SIZ; i++) {
                if ((bkt[b][i] & fpMsk) == fp) {
                        val = bkt[b][i] & valMsk;
                        if (keyVec[val] == key) return val;
                }
        }

	// check bucket in the second half of the bucket array
        hashit(key,1,b,fp); b += nb;
        for (i = 0; i < BKT_SIZ; i++) {
                if ((bkt[b][i] & fpMsk) == fp) {
                        val = bkt[b][i] & valMsk;
                        if (keyVec[val] == key) return val;
                }
        }
	return 0;
}

/** Insert a (key,value) pair into hash table.
 *  If a pair with the given key is already present, its value is replaced.
 *  @param key is the key part of the pair
 *  @param val is the value part of the pair
 *  @return true on success, false on failure.
 */
bool HashTbl::insert(uint64_t key, index val) {
	int i, j0, j1, n0, n1;
	uint32_t b0, b1, fp0, fp1;

	if (val > n())  {
		string s = "HashTbl::makeSpace: requested value exceeds "
			   "index range";
		throw IllegalArgumentException(s);
	}

	// Count the number of unused items in each bucket
	// and find an unused item in each (if there is one)
	// quit early if we already have an entry for this key
	hashit(key,0,b0,fp0);
	j0 = n0 = 0;
	for (i = 0; i < BKT_SIZ; i++) {
		if (bkt[b0][i] == 0) { n0++; j0 = i; }
		else if ((bkt[b0][i] & fpMsk) == fp0) {
			uint32_t oldval = bkt[b0][i] & valMsk;
			if (keyVec[oldval] == key) {
				bkt[b0][i] = fp0 | (val & valMsk);
				keyVec[val] = key;
				return true;
			}
		}
	}
	hashit(key,1,b1,fp1); b1 += nb;
	j1 = n1 = 0;
	for (i = 0; i < BKT_SIZ; i++) {
		if (bkt[b1][i] == 0) { n1++; j1 = i; }
		else if ((bkt[b1][i] & fpMsk) == fp0) {
			uint32_t oldval = bkt[b1][i] & valMsk;
			if (keyVec[oldval] == key) {
				bkt[b1][i] = fp0 | (val & valMsk);
				keyVec[val] = key;
				return true;
			}
		}
	}
	// If no unused entry in either bucket, give up.
	if (n0 + n1 == 0) return false;

	// store the key value in keyVec and add entry in least-loaded bucket
	keyVec[val] = key;
	if (n0 >= n1) bkt[b0][j0] = fp0 | (val & valMsk);
	else bkt[b1][j1] = fp1 | (val & valMsk);
	siz++;
		
	return true;
}

/** Remove a (key, value) pair from the table.
 *  @param key is the key of the pair to be removed
 *  @return the associated value, or 0 if no such pair is in the table
 */
int HashTbl::remove(uint64_t key) {
	int i; uint32_t b, val, fp;

	hashit(key,0,b,fp);
	for (i = 0; i < BKT_SIZ; i++) {
		if ((bkt[b][i] & fpMsk) == fp) {
			val = bkt[b][i] & valMsk;
			if (keyVec[val] == key) {
				bkt[b][i] = 0; { siz--; return val; }
			}
		}
	}
	hashit(key,1,b,fp); b += nb;
	for (i = 0; i < BKT_SIZ; i++) {
		if ((bkt[b][i] & fpMsk) == fp) {
			val = bkt[b][i] & valMsk;
			if (keyVec[val] == key) {
				bkt[b][i] = 0; { siz--; return val; }
			}
		}
	}
	return 0;
}

/** Create string representation of hash table.
 *  Includes all key,value pairs stored in the hash table,
 *  along with their bucket index, offset within the bucket
 *  and fingerprint.
 *  @return the string
 */
string HashTbl::toString() const {
	int i, j, shift; uint32_t vm, val, fp; uint32_t *bucket;

	// Determine amount to shift to right-justify fingerprints
	vm = valMsk; shift = 0; while (vm != 0) { vm >>= 1; shift++; }

	string s;
	for (i = 0; i < 2*nb; i++) {
		bucket = &bkt[i][0];
		for (j = 0; j < BKT_SIZ; j++) {
			if (bucket[j] != 0) {
				s += to_string(i) + "," + to_string(j) + ": ";
				val =  bucket[j] & valMsk;
				fp  = (bucket[j] &  fpMsk) >> shift;
				s += to_string(keyVec[val]) + " "
				   + to_string(val) + " "
				   + to_string(fp) + "\n";
			}
		}
	}
	return s;
}

} // ends namespace
