/** @file IdMap.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;
import algoLib.misc.*;

/** Data structure that assigns small integer identifiers to large keys.
 *  This is useful in contexts where the "natural identifiers"
 *  in an application can vary over a large range, but the number
 *  of distinct identifiers that are in use at one time is relatively
 *  small. This data structure can be used to map the "natural identfiers"
 *  into integers in a restricted range 1..max, where max is specified
 *  when the data structure is initialized.
 */
public class IdMap {
	private static final int MAXID = (1 << 20)-1;  ///< largest possible id
	private int n;			///< largest identifier in this set
	private int cnt;		///< number of valid mappings
	private UiHashTbl ht;		///< hash table to compute mapping
	private UiSetPair ids;		///< in-use and free ids

	/** Constructor for IdMap, allocates space and initializes table.
	 *  N1 is the limit on the range of values; it must be less than 2^20.
	 */
	public IdMap(int n) {
		this.n = n;
		if (n > MAXID) Util.fatal("IdMap: specified size too large");
		ht = new UiHashTbl(n);
		ids = new UiSetPair(n);
		cnt = 0;
	};

	/** Get the first assigned identifier, in some arbitrary order.
	 *  @return number of the first identfier
	 */
	public int firstId() { return ids.firstIn(); }
	
	/** Get the last assigned identifier, in some arbitrary order.
	 *  @return number of the last identfier
	 */
	public int lastId() { return ids.lastIn(); }
	
	/** Get the next assigned identifier, in some arbitrary order.
	 *  @param id is an identifer in the set
	 *  @return number of the next identfier
	 */
	public int nextId(int id) { return ids.nextIn(id); }
	
	/** Determine if a given key has been mapped to an identfier.
	 *  @param key is the key to be checked
	 *  @return true if the key has been mapped, else false
	 */
	public boolean validKey(long key) {
		return (ht.lookup(key) != 0);
	}
	
	/** Determine if a given identifier has been assigned to a key.
	 *  @param id is the identifier to be checked
	 *  @return true if the key has been mapped, else false
	 */
	public boolean validId(int id) {
		return (1 <= id && id <= n && ids.isIn(id));
	}
	
	public int size() { return cnt; }
	
	/** Get the id for a given key.
	 *  @param key is the key for which the id is required
	 *  @return the corresponding id or 0 if the key is not
	 *  mapped or the operation fails
	 */
	public int getId(long key) { return ht.lookup(key); }
	
	/** Get the key that was mapped to the given identifier
	 *  @param id is the identifier whose key is to be returned
	 *  @return the key that maps to id, or 0 if there is none
	 */
	public long getKey(int id) {
		return (validId(id) ? ht.getKey(id) : 0); 
	}
	
	/** Add a new key-id pair.
	 *  @param key is the key for which an id is required
	 *  @return the new id or 0 if the key is already mapped or the
	 *  operation fails
	 */
	public int addPair(long key) {
		if (validKey(key) || (ids.firstOut() == 0)) return 0;
		int id = ids.firstOut(); 
		if (!ht.insert(key,id)) return 0;
		ids.swap(id);
		cnt++;
		return id;
	}
	
	/** Add a new key-id pair.
	 *  @param key is the key for which an id is required
	 *  @param id is the requested id that the key is to be mapped to
	 *  @return the new id or 0 if the key is already mapped or the
	 *  id is already in use or the operation fails
	 */
	public int addPair(long key, int id) {
		if (validKey(key) || validId(id)) return 0;
		if (!ht.insert(key,id)) return 0;
		ids.swap(id);
		cnt++;
		return id;
	}
	
	/** Remove a pair from the mapping.
	 *  This operation removes a (key,id) pair from the mapping.
	 *  @param key is the key whose id is to be released
	 */
	public void dropPair(long key) {
		int id = ht.lookup(key);
		if (id == 0) return;
		ht.remove(key);
		ids.swap(id);
		cnt--;
	}
	
	/** Clear the IdMap.  */
	public void clear() {
		for (int i = firstId(); i != 0; i = firstId()) ids.swap(i);
	}
	
	/** Create a String representation of the IdMap.
	 *  @param s is the String in which the
	 */
	public String toString() {
		String s = "{ ";
		for (int i = firstId(); i != 0; i = nextId(i)) {
			s += "(" + ht.getKey(i) + "," + i + ") ";
		}	
		return s + "}";
	}
}
