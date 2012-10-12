/** @file UiSetPair.java 
 *
 * @author Jon Turner
 * @date 2011
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.dataStructures.basic;

public class UiSetPair {
	private int n;		 ///< largest integer in set pair
	private int numIn;	 ///< number of elements in in-set
	private int numOut;	 ///< number of elements in out-set

	private int inHead;	 ///< first value in the in-set
	private int inTail;	 ///< last value in the in-set
	private int outHead;	 ///< first value in the out-set
	private int outTail;	 ///< last value in the out-set

	private int[] nxt;	 ///< nxt[i] defines next value after i
	private int[] prv;	 ///< prv[i] defines value preceding i

	/** Create a list pair that can hold items in 1..n */
	public UiSetPair(int n) {
		this.n = n;
		nxt = new int[n+1]; prv = new int[n+1];
		reset();
	}

	/** Reset the pair.
	 *  Puts all elements in the the "out-set".
	 */
	public void reset() {
		inHead = inTail = 0;
		for (int i = 1; i < n; i++) {
			nxt[i] = -(i+1); prv[i+1] = -i;
		}
		nxt[n] = prv[1] = 0;
		outHead = 1; outTail = n;
		numIn = 0; numOut = n;
	
		nxt[0] = prv[0] = 0;
	}

	/** Determine if an integer belongs to the "in-set".
	 *  @param i is an integer in the range supported by the object
	 *  @param return true if i is a member of the "in-set", else false.
	 */
	public boolean isIn(int i) {
	        return 1 <= i && i <= n && (nxt[i] > 0 || i == inTail);
	}
	
	/** Determine if an integer belongs to the "out-set".
	 *  @param i is an integer in the range supported by the object
	 *  @param return true if i is a member of the "out-set", else false.
	 */
	public boolean isOut(int i) {
	        return 1 <= i && i <= n && (nxt[i] < 0 || i == outTail);
	}
	
	public int getNumIn() { return numIn; }
	public int getNumOut() { return numOut; }
	
	/** Get the first int in the in-set.
	 *  @return the first value on the in-set or 0 if the list is empty.
	 */
	public int firstIn() { return inHead; }
	
	/** Get the first int in the out-set.
	 *  @return the first value on the out-set or 0 if the list is empty.
	 */
	public int firstOut() { return outHead; }
	
	/** Get the last int in the in-set.
	 *  @return the last value on the in-set or 0 if the list is empty.
	 */
	public int lastIn() { return inTail; }
	
	/** Get the first int in the out-set.
	 *  @return the last value on the out-set or 0 if the list is empty.
	 */
	public int lastOut() { return outTail; }
	
	/** Get the next value in the inlist.
	 *  @param i is the "current" value
	 *  @return the next value on the in-set or 0 if no more values
	 */
	public int nextIn(int i) {
	        return (0 <= i && i <= n && nxt[i] > 0 ? nxt[i] : 0);
	}
	
	/** Get the next value in the outlist.
	 *  @param i is the "current" value
	 *  @return the next value on the out-set or 0 if no more values
	 */
	public int nextOut(int i) {
	        return (0 <= i && i <= n && nxt[i] < 0 ? -nxt[i] : 0);
	}
	
	/** Get the previous value in the inlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the in-set or 0 if no more values
	 */
	public int prevIn(int i) {
	        return (0 <= i && i <= n && prv[i] > 0 ? prv[i] : 0);
	}
	
	/** Get the previous value in the outlist.
	 *  @param i is the "current" value
	 *  @return the previous value on the out-set or 0 if no more values
	 */
	public int prevOut(int i) {
	        return (0 <= i && i <= n && prv[i] < 0 ? -prv[i] : 0);
	}
	
	/** Move an item from one list to the other.
	 * Inserts item at end of the other list
	 * @param i is the value to be swapped
	 */
	public void swap(int i) {
		if (i < 1 || i > n) return;
		if (isIn(i)) {
			if (nxt[i] == 0) inTail = prv[i];
			else prv[nxt[i]] = prv[i];
	
			if (prv[i] == 0) inHead = nxt[i];
			else nxt[prv[i]] = nxt[i];
	
			nxt[i] = 0;
			if (outTail == 0) {
				outHead = i; prv[i] = 0;
			} else {
				nxt[outTail] = -i; prv[i] = -outTail;
			}
			outTail = i;
			numIn--; numOut++;
		} else {
			if (nxt[i] == 0) outTail = -prv[i];
			else prv[-nxt[i]] = prv[i];
	
			if (prv[i] == 0) outHead = -nxt[i];
			else nxt[-prv[i]] = nxt[i];
	
			nxt[i] = 0;
			if (inTail == 0) {
				inHead = i; prv[i] = 0;
			} else {
				nxt[inTail] = i; prv[i] = inTail;
			}
			inTail = i;
			numIn++; numOut--;
		}
	}
	
	/** Create a string representation of the set pair.
	 */
	public String toString() {
		String s = "[ ";
		for (int i = firstIn(); i != 0; i = nextIn(i))   s += i + " ";
		s += "] [ ";
		for (int i = firstOut(); i != 0; i = nextOut(i)) s += i + " ";
		s += "]";
		return s;
	}
}
