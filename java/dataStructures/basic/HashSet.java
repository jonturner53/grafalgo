/** @file HashSet.java
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;
import algoLib.misc.*;

/** Maintains set of keys, where a key is a long.
 * 
 *  Main methods
 *    member - tests a key for membership in the set
 *    insert - adds a key to the set
 *    remove - removes a key from the set
 * 
 *  The implementation uses a 2-left hash table with eight items
 *  in each bucket. The number of keys is limited to 2^20 - 1.
 *  This ensures ensures a  maximum load factor of 50%
 *  to minimize the potential for overloading any bucket.
 */
public class HashSet {
	private static final int BKT_SIZ = 8;	///< # of items per bucket
	private static final int MAXSIZE = (1 << 20)-1;	///< max number of pairs

	private int ssiz;	///< size of set
	private int n;		///< max number of items in set
	private int nb;		///< number of hash buckets per section
	private int bktMsk;     ///< mask used to extract bucket index
	private int kxMsk;	///< mask used to extract key index
	private int fpMsk;	///< mask used to extract fingerprint

	private int [][] bkt;	///< vector of hash backets
	private long [] keyTab;	///< array of keys in set
	private int free;	///< index of first free entry in keyTab

	private class Pair {
	int	b;
	int	fp;
	}

	/** Constructor for HashSet, allocates space and initializes table.
	 *  N1 is the limit on the size of the set; it must be less than 2^20.
	 */
	public HashSet(int n) {
		this.n = n;
		if (n > MAXSIZE) Util.fatal("HashSet: size out of range");
	
		for (nb = 1; 8*nb <= n; nb <<= 1) {}
		nb = Math.max(nb,4);
		bktMsk = nb - 1; kxMsk = (8*nb) - 1; fpMsk = ~kxMsk;
	
		bkt = new int[2*nb][BKT_SIZ];
		keyTab = new long[n+1];
	
		clear();
	};
		
	/** Determine the number of keys in the set.
	 *  @return the number of keys in the set
	 */
	public int size() { return ssiz; }
	
	/** Clear the set contents. */
	public void clear() {
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
	private Pair hashit(long key, int hf) {
		int A0 = 0xa96347c5;
		int A1 = 0xe65ac2d3;
	
		int x, y; long z;
	
		x  = (int) ((key >> 16) & 0xffff0000);
		x |= (int) ((key & 0xffff));
		y  = (int) ((key >> 48) & 0xffff);
		y |= (int) ((key & 0xffff0000)); 
		z = x ^ y;
		z *= (hf == 0 ? A0 : A1);
		Pair p = new Pair();
		p.b  = (int) ((z >> 16) & bktMsk);
		p.fp = (int) ((z >> 13) & fpMsk);
		return p;
	}
	
	/** Determine if a given key is in the set.
	 *  @param key is the key to be looked up in the table
	 *  @return true if key is in the set, else false
	 */
	public boolean member(long key) {
		Pair p;
	
		// check bucket in the first half of the bucket array
		p = hashit(key,0);
		for (int i = 0; i < BKT_SIZ; i++) {
	                if ((bkt[p.b][i] & fpMsk) == p.fp) {
	                        int kx = bkt[p.b][i] & kxMsk;
	                        if (keyTab[kx] == key) return true;
	                }
	        }
	
		// check bucket in the second half of the bucket array
	        p = hashit(key,1); p.b += nb;
	        for (int i = 0; i < BKT_SIZ; i++) {
	                if ((bkt[p.b][i] & fpMsk) == p.fp) {
	                        int kx = bkt[p.b][i] & kxMsk;
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
	public boolean insert(long key) {
		int i, j0, j1, n0, n1;
	
		if (free == 0) return false;
	
		// Count the number of unused items in each bucket
		// and find an unused item in each (if there is one)
		Pair p0 = hashit(key,0);
		j0 = n0 = 0;
		for (i = 0; i < BKT_SIZ; i++) {
			if (bkt[p0.b][i] == 0) {
				n0++; j0 = i;
			} else if ((bkt[p0.b][i] & fpMsk) == p0.fp) {
				// key may already be in map
	                        int kx = bkt[p0.b][i] & kxMsk;
	                        if (keyTab[kx] == key) return true;
	                }
		}
		Pair p1 = hashit(key,1);
		hashit(key,1); p1.b += nb;
		j1 = n1 = 0;
		for (i = 0; i < BKT_SIZ; i++) {
			if (bkt[p1.b][i] == 0) {
				n1++; j1 = i;
			} else if ((bkt[p1.b][i] & fpMsk) == p1.fp) {
				// key may already be in map
	                        int kx = bkt[p1.b][i] & kxMsk;
	                        if (keyTab[kx] == key) return true;
	                }
		}
		// If no unused entry in either bucket, give up.
		if (n0 + n1 == 0) return false;
	
		// store the key value in keyTab and add entry in
		// least-loaded bucket
		int kx = free; free = (int) keyTab[free];
		keyTab[kx] = key; 
		if (n0 >= n1) bkt[p0.b][j0] = p0.fp | (kx & kxMsk);
		else bkt[p1.b][j1] = p1.fp | (kx & kxMsk);
		ssiz++;
			
		return true;
	}
	
	/** Remove a key from the set.
	 *  @param key is the key of the pair to be removed
	 */
	public void remove(long key) {
		int b, fp;
	
		Pair p = hashit(key,0);
		for (int i = 0; i < BKT_SIZ; i++) {
			if ((bkt[p.b][i] & fpMsk) == p.fp) {
				int kx = bkt[p.b][i] & kxMsk;
				if (keyTab[kx] == key) {
					keyTab[kx] = free; free = kx;
					bkt[p.b][i] = 0;
					ssiz--;
					return;
				}
			}
		}
		p = hashit(key,1); p.b += nb;
		for (int i = 0; i < BKT_SIZ; i++) {
			if ((bkt[p.b][i] & fpMsk) == p.fp) {
				int kx = bkt[p.b][i] & kxMsk;
				if (keyTab[kx] == key) {
					keyTab[kx] = free; free = kx;
					bkt[p.b][i] = 0;
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
	public String toString() {
		String s = "";
		for (int b = 0; b < nb; b++) {
			for (int i = 0; i < BKT_SIZ; i++) {
				if (bkt[b][i] != 0) {
					int kx = bkt[b][i] & kxMsk;
					s += keyTab[kx] + " ";
				}
				if (bkt[b+nb][i] != 0) {
					int kx = bkt[b+nb][i] & kxMsk;
					s += keyTab[kx] + " ";
				}
			}
		}
		return s;
	}
}
