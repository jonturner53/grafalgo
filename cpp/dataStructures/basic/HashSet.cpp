/** @file HashSet.cpp 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "HashSet.h"

/** Constructor for HashSet, allocates space and initializes table.
 *  N1 is the limit on the size of the set; it must be less than 2^20.
 */
HashSet::HashSet(int n1) : n(n1) {
	if (n > MAXSIZE) fatal("HashSet: size out of range");

	for (nb = 1; 8*nb <= n; nb <<= 1) {}
	nb = max(nb,4);
	bktMsk = nb - 1; kxMsk = (8*nb) - 1; fpMsk = ~kxMsk;

	bkt = new bkt_t[2*nb];
	keyTab = new uint64_t[n+1];

	clear();
};
	
/** Destructor for HashSet. */
HashSet::~HashSet() {
	delete [] bkt; delete [] keyTab;
}

/** Clear the set contents. */
void HashSet::clear() {
	for (int i = 0; i < 2*nb; i++) {
		for (int j = 0; j < BKT_SIZ; j++) bkt[i][j] = 0;
	}
	free = 1;
	for (int i = 1; i < n; i++) keyTab[i] = i+1;
	keyTab[n] = 0;
	ssiz = 0;
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
void HashSet::hashit(uint64_t key, int hf, uint32_t& b, uint32_t& fp) const {
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

/** Determine if a given key is in the set.
 *  @param key is the key to be looked up in the table
 *  @return true if key is in the set, else false
 */
bool HashSet::member(uint64_t key) const {
	uint32_t b, fp;

	// check bucket in the first half of the bucket array
	hashit(key,0,b,fp);
	for (int i = 0; i < BKT_SIZ; i++) {
                if ((bkt[b][i] & fpMsk) == fp) {
                        int kx = bkt[b][i] & kxMsk;
                        if (keyTab[kx] == key) return true;
                }
        }

	// check bucket in the second half of the bucket array
        hashit(key,1,b,fp); b += nb;
        for (int i = 0; i < BKT_SIZ; i++) {
                if ((bkt[b][i] & fpMsk) == fp) {
                        int kx = bkt[b][i] & kxMsk;
                        if (keyTab[kx] == key) return true;
                }
        }
	return false;
}

/** Add a key to the set.
 *  @param key is the key to be added; if already present in set
 *  no change is made to the set
 *  @return true on success, false on failure.
 */
bool HashSet::insert(uint64_t key) {
	int i, j0, j1, n0, n1;
	uint32_t b0, b1, fp0, fp1;

	if (free == 0) return false;

	// Count the number of unused items in each bucket
	// and find an unused item in each (if there is one)
	hashit(key,0,b0,fp0);
	j0 = n0 = 0;
	for (i = 0; i < BKT_SIZ; i++) {
		if (bkt[b0][i] == 0) {
			n0++; j0 = i;
		} else if ((bkt[b0][i] & fpMsk) == fp0) {
			// key may already in map
                        int kx = bkt[b0][i] & kxMsk;
                        if (keyTab[kx] == key) return true;
                }
	}
	hashit(key,1,b1,fp1); b1 += nb;
	j1 = n1 = 0;
	for (i = 0; i < BKT_SIZ; i++) {
		if (bkt[b1][i] == 0) {
			n1++; j1 = i;
		} else if ((bkt[b1][i] & fpMsk) == fp1) {
			// key may already in map
                        int kx = bkt[b1][i] & kxMsk;
                        if (keyTab[kx] == key) return true;
                }
	}
	// If no unused entry in either bucket, give up.
	if (n0 + n1 == 0) return false;

	// store the key value in keyTab and add entry in least-loaded bucket
	int kx = free; free = keyTab[free];
	keyTab[kx] = key; 
	if (n0 >= n1) bkt[b0][j0] = fp0 | (kx & kxMsk);
	else bkt[b1][j1] = fp1 | (kx & kxMsk);
	ssiz++;
		
	return true;
}

/** Remove a key from the set.
 *  @param key is the key of the pair to be removed
 */
void HashSet::remove(uint64_t key) {
	uint32_t b, fp;

	hashit(key,0,b,fp);
	for (int i = 0; i < BKT_SIZ; i++) {
		if ((bkt[b][i] & fpMsk) == fp) {
			int kx = bkt[b][i] & kxMsk;
			if (keyTab[kx] == key) {
				keyTab[kx] = free; free = kx;
				bkt[b][i] = 0;
				ssiz--;
				return;
			}
		}
	}
	hashit(key,1,b,fp); b += nb;
	for (int i = 0; i < BKT_SIZ; i++) {
		if ((bkt[b][i] & fpMsk) == fp) {
			int kx = bkt[b][i] & kxMsk;
			if (keyTab[kx] == key) {
				keyTab[kx] = free; free = kx;
				bkt[b][i] = 0;
				ssiz--;
				return;
			}
		}
	}
	return;
}

/** Construct string listing the keys in the set.
 *  @param s is a reference to a string in which the result is returned
 */
string& HashSet::toString(string& s) const {
	stringstream ss;
	for (int b = 0; b < nb; b++) {
		for (int i = 0; i < BKT_SIZ; i++) {
			if (bkt[b][i] != 0) {
				int kx = bkt[b][i] & kxMsk;
				ss << keyTab[kx] << " ";
			}
			if (bkt[b+nb][i] != 0) {
				int kx = bkt[b+nb][i] & kxMsk;
				ss << keyTab[kx] << " ";
			}
		}
	}
        s = ss.str();
	return s;
}

