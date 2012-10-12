/** @file UiHashTbl.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;

import algoLib.misc.Util;

/** Maintains set of (key, value) pairs where key is a 64 bit value and
 *  value is a positive 32 bit integer in a restricted range.
 *  All (key,value) pairs must be fully disjoint; that is no two pairs may
 *  share the same key and no two pairs may share the same value.
 * 
 *  Main methods
 *    lookup - returns value for given key
 *    insert - adds a (key,value) pair
 *    remove - removes the pair for a given key
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The hash table is configured for a specified
 *  range of values (max of 10^6) with a maximum load factor of
 *  50% to minimize the potential for overloading any bucket.
 */
public class UiHashTbl {
	private static final int BKT_SIZ = 8;	///< # of items per bucket
	private static final int MAXVAL = (1 << 20)-1;	///< max stored value
	private int n;			///< range of values is 1..n
	private int nb;			///< number of hash buckets per section
	private int bktMsk;		///< mask used to extract bucket index
	private int valMsk;		///< mask used to extract value
	private int fpMsk;		///< mask used to extract fingerprint

	private int[] bkt;		///< vector of hash backets
	private long[] keyVec;		///< vector of keys, indexed by value

	private class Pair {
	int	b;
	int	fp;
	}
	
	/** Constructor for hashTbl, allocates space and initializes table.
	 *  N1 is the limit on the range of values; it must be less than 2^20.
	 */
	public UiHashTbl(int n) {
		if (n > MAXVAL) Util.fatal("UiHashTbl: size out of range");
		this.n = n;
	
		for (nb = 1; BKT_SIZ*nb < n; nb <<= 1) {}
		nb = Math.max(nb,4);
		bktMsk = nb - 1; valMsk = (BKT_SIZ*nb) - 1; fpMsk = ~valMsk;
	
		bkt = new int[2*nb*BKT_SIZ]; keyVec = new long[n+1];
	
		clear();
	}

	/** Get the key associated with a given value.
	 *  @param i is the value whose key is being retrieved
	 *  @return the corresponding key; assumes that i is the value for
	 *  some key
	 */
	public long getKey(int i)  { return keyVec[i]; }
		
	/** Clear the hashtable contents. */
	void clear() {
		for (int i = 0; i < 2*nb*BKT_SIZ; i++) bkt[i] = 0;
		for (int i = 0; i <= n; i++) keyVec[i] = 0;
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
	public Pair hashit(long key, int hf) {
		 int A0 = 0xa96347c5;
		 int A1 = 0xe65ac2d3;
	
		int x, y; long z;
	
		x = (int) (key >> 16);
		x &= 0xffff0000;
		x |= ((int) (key & 0xffff));
		y = (int) (key >> 48) ;
		y &= 0xffff;
		y |= ((int) (key & 0xffff0000)); 
		z = x ^ y;
		z *= (hf == 0 ? A0 : A1);

		Pair p = new Pair();
		p.b = ((int) (z >> 16)) & bktMsk;
		p.fp  = ((int) (z >> 13)) & fpMsk;
		return p;
	}
	
	/** Perform a lookup in the hash table.
	 *  @param key is the keey to be looked up in the table
	 *  @return the value stored for the given key, or 0 if there is none.
	 */
	public int lookup(long key) {
		// check bucket in the first half of the bucket array
		Pair p = hashit(key,0);
		for (int i = 0; i < BKT_SIZ; i++) {
	                if ((bkt[p.b*BKT_SIZ+i] & fpMsk) == p.fp) {
	                        int val = bkt[p.b*BKT_SIZ+i] & valMsk;
	                        if (keyVec[val] == key) return val;
	                }
	        }
	
		// check bucket in the second half of the bucket array
	        p = hashit(key,1); p.b += nb;
	        for (int i = 0; i < BKT_SIZ; i++) {
	                if ((bkt[p.b*BKT_SIZ+i] & fpMsk) == p.fp) {
	                        int val = bkt[p.b*BKT_SIZ+i] & valMsk;
	                        if (keyVec[val] == key) return val;
	                }
	        }
		return 0;
	}
	
	/** Insert a (key,value) pair into hash table.
	 *  No check is made to ensure that there is no conflicting
	 *  (key,value) pair.
	 *  @param key is the key part of the pair
	 *  @param val is the value part of the pair
	 *  @return true on success, false on failure.
	 */
	public boolean insert(long key, int val) {
		int j0 = 0, j1 = 0, n0, n1;
	
		if (val > n) Util.fatal("insert: value out of range");
	
		// Count the number of unused items in each bucket
		// and find an unused item in each (if there is one)
		Pair p0 = hashit(key,0);
		n0 = 0;
		for (int i = 0; i < BKT_SIZ; i++) {
			if (bkt[p0.b*BKT_SIZ + i] == 0) { n0++; j0 = i; }
		}
		Pair p1 = hashit(key,1); p1.b += nb;
		n1 = 0;
		for (int i = 0; i < BKT_SIZ; i++) {
			if (bkt[p1.b*BKT_SIZ + i] == 0) { n1++; j1 = i; }
		}
		// If no unused entry in either bucket, give up.
		if (n0 + n1 == 0) return false;
	
		// store the key value in keyVec and add entry in 
		// least-loaded bucket
		keyVec[val] = key;
		if (n0 >= n1) bkt[p0.b*BKT_SIZ+j0] = p0.fp | (val & valMsk);
		else bkt[p1.b*BKT_SIZ+j1] = p1.fp | (val & valMsk);
			
		return true;
	}
	
	/** Remove a (key, value) pair from the table.
	 *  @param key is the key of the pair to be removed
	 */
	public void remove(long key) {
		Pair p = hashit(key,0);
		for (int i = 0; i < BKT_SIZ; i++) {
			if ((bkt[p.b*BKT_SIZ+i] & fpMsk) == p.fp) {
				int val = bkt[p.b*BKT_SIZ+i] & valMsk;
				if (keyVec[val] == key) {
					bkt[p.b*BKT_SIZ+i] = 0; return;
				}
			}
		}
		p = hashit(key,1); p.b += nb;
		for (int i = 0; i < BKT_SIZ; i++) {
			if ((bkt[p.b*BKT_SIZ+i] & fpMsk) == p.fp) {
				int val = bkt[p.b*BKT_SIZ+i] & valMsk;
				if (keyVec[val] == key) {
					bkt[p.b*BKT_SIZ+i] = 0; return;
				}
			}
		}
	}
	
	/** Print out all key,value pairs stored in the hash table,
	 *  along with their bucket index, offset within the bucket
	 *  and fingerprint.
	 */
	public String toString() {
		String s = "";
	
		// Determine amount to shift to right-justify fingerprints
		int vm = valMsk; int sc = 0;
		while (vm != 0) { vm >>= 1; sc++; }
	
		for (int i = 0; i < 2*nb; i++) {
			int base = i*BKT_SIZ;
			for (int j = 0; j < BKT_SIZ; j++) {
				if (bkt[base+j] != 0) {
					int val =  bkt[base+j] & valMsk;
					int fp  = (bkt[base+j] & fpMsk) >> sc;
					s += i + "," + j + ": " + keyVec[val];
					s += " " + val + " " + fp + "\n";
				}
			}
		}
		return s;
	}
}
