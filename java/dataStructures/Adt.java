/** @file Adt.java
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.dataStructures;

import java.util.ArrayList;
import java.util.Scanner;
import java.util.regex.Pattern;

/** The Adt class is a base class from which other data structures
 *  in grafalgo are derived.
 *
 *  The data structures in grafalgo are built using integer index values
 *  to refer to specific items (set elements, nodes in search trees,
 *  vertices in graphs). In this context, an index is a positive integer
 *  in a bounded range 1..n, for some value of n.
 *
 *  The use of index values has a couple advantages over pointers.
 *  First, index values can serve as common "handles" for
 *  items in multiple data structures, eliminating the need to have
 *  explicit mappings to relate such items. As one example,
 *  in an algorithm that uses a graph and a separate list of vertices,
 *  both can use the same indexes to represent the vertices.
 *  Index values also make it trivial to have fast membership tests
 *  for index lists and similar data structures.
 */
public class Adt {
	private int N;		// index values in 1..N
	private static Pattern
		indexPattern = Pattern.compile("\\G\\p{javaLowerCase}|\\d+");

	public Adt(int n) { N = n; }

	public Adt() { N = 26; }

	protected void setRange(int n) { N = n; };

	/** Get the maximum index value for the data structure
	 *  @return the largest allowed index value
	 */
	public int n() { return N; }

	/** Determine if a given index is valid.
	 *  @param[in] i is an integer
	 *  @return true if i lies within the allowed range of index values,
	 *  else false; note 0 is allowed and is used as a null index
	 */
	public boolean valid(int i) { return 0 <= i && i <= N; }

	/** Create a string representation of the data structure.
	 *  Should show all information relevant to the provided abstraction.
	 *  Subclasses are all expected to implement this method.
 	 */
	public String toString() { return ""; };

	/** Create an alternate string representation of the data structure,
	 *  showing implementation details.
	 *  @returns a string that represents the internal details of the
	 *  data structure; for subclasses that do not provide their own
	 *  long string representation, the "short" string is used by default.
 	 */
	public String toLongString() { return toString(); };

	/** Compare two Adts for equality.
	 *  @param a2 is an Adt object to be compared to this.
	 *  @return true if this is equal to a2; for subclasses that do not
	 *  provide their own equality check, comparison defaults to equality
	 *  of the string representations.
	 */
	public boolean equals(Adt a2) { return toString().equals(a2.toString()); }

	/** Compare two Adts for equality, including internal details.
	 *  @param a2 is an Adt object to be compared to this.
	 *  @return true if this is equal to a2, not just at the abstraction
	 *  level, but also for internal details; for subclasses that do not
	 *  provide their own long equality check, comparison defaults to equality
	 *  of the long string representations.
	 */
	public boolean longEquals(Adt a2) {
		return toLongString().equals(a2.toLongString());
	}

	/** Check the data structure for internal consistency.
	 *  @return true if the data structure is internally consistent,
	 *  else return false; if a subclass does not supply a consistent()
	 *  method, false is returned.
	 */
	public boolean consistent() {
		return false;
	}

	public void println() { System.out.println(toString()); }

	public void printlnLong() { System.out.println(toLongString()); }

	/** Verify the next (non-space) character.
	 *  @param in is a Scanner from which input is read
	 *  @param c is a character to be matched against the input
	 *  @param skip determines if leading space characters are skipped or not;
	 *  it is true by default
	 */
	public boolean verify(Scanner in, String s, boolean skip) {
		try {
			if (skip) in.skip("\\G\\s*");
			return in.findWithinHorizon("\\G" + s, 10) != null;
		} catch(Exception e) {
			return false;
		}
	}

	public boolean verify(Scanner in, String s) { return verify(in, s, true); }

	/** Read an index from the input stream.
	 *  An index typically represents some component of a data structure,
	 *  such as an element of a set or vertex in a graph.
	 *  By convention, data structures whose index sets have at most 26 elements
	 *  have a string representation that substitutes lower-case
	 *  letters for the index values used internally (so 1 becomes 'a',
	 *  2 becomes 'b' and so forth). On input, if the next non-space
	 *  character is a lower-case letter, we replace 'a' with 1, etc.
	 *  If the next non-space character is a digit, we read an integer
	 *  and interpret it as an index.
	 *  @param in is a Scanner for the input stream
	 *  @return the index value on success, else 0
	 */
	public int readIndex(Scanner in) {
		try {
			in.skip("\\G\\s*");
			String s = in.findWithinHorizon(indexPattern, 20);
			if (s == null) return 0;
			if (Character.isLowerCase(s.charAt(0)))
				return (s.charAt(0) - 'a') + 1;
			else
				return Integer.parseInt(s);
		} catch(Exception e) {
			return 0;
		}
	}

	public ArrayList<Integer> readIndexList(Scanner in, String ld, String rd) {
		try {
			in.skip("\\s*");
			if (in.findWithinHorizon("\\G" + ld, 1) == null)
				return null;
			ArrayList<Integer> l = new ArrayList<Integer>();
			while (true) {
				int x = readIndex(in);
				if (x == 0) break;
				l.add(x);
				if (in.findWithinHorizon("\\G\\s", 1) == null)
					break;
			}
			return (in.findWithinHorizon("\\G" + rd, 1) == null) ? null : l;
		} catch(Exception e) {
			return null;
		}
	}
			
	/** Convert an index to a string.
	 *  @param[in] x is a valid index for the data structure
	 *  @return a string that represents the value of x; if n()>26, this is
	 *  just the string representing the number x, otherwise, it is a lower-case
	 *  letter.
	 */
	public String index2string(int x) {
		String s = "";
		if (n() <= 26) {
			if (x == 0) s += '-';
			else s += ((char) ((x-1) + 'a'));
		} else {
			s += x;
		}
		return s;
	}

	/* Handy methods for unit testing. */

	public void assertEqual(Adt a2, String tag) {
		if (!this.equals(a2)) {
			System.out.printf("%s [%s %s]%n", tag, this, a2);
			System.exit(1);
		}
	}

	public void assertEqualLong(Adt a2, String tag) {
		if (!this.longEquals(a2)) {
			System.out.printf("%s [%s %s]%n", tag,
							  toLongString(), a2.toLongString());
			System.exit(1);
		}
	}

	public void assertEqual(Adt a2, int v1, int v2, String tag) {
		if (!this.equals(a2) || v1 != v2) {
			System.out.printf("%s [%s %s %d %d]%n", tag, this, a2, v1, v2);
			System.exit(1);
		}
	}

	public void assertEqualLong(Adt a2, int v1, int v2, String tag) {
		if (!this.longEquals(a2) || v1 != v2) {
			System.out.printf("%s [%s %s %d %d]%n", tag,
							  this.toLongString(), a2.toLongString(), v1, v2);
			System.exit(1);
		}
	}

	public void assertEqual(String s2, String tag) {
		assertEqual(toString(), s2, tag);
	}

	public void assertEqual(String s2, int v1, int v2, String tag) {
		assertEqual(toString(), s2, v1, v2, tag);
	}

	public void assertEqualLong(String s2, String tag) {
		assertEqual(toLongString(), s2, tag);
	}

	public void assertEqualLong(String s2, int v1, int v2, String tag) {
		assertEqual(toLongString(), s2, v1, v2, tag);
	}

	public void assertTrue(boolean success, String tag) {
		if (!success) {
			System.out.println(tag); System.exit(1);
		}
	}

	public void assertEqual(int v1, int v2, String tag) {
		if (v1 != v2) {
			System.out.printf("%s [%d %d]%n", tag, v1, v2); System.exit(1);
		}
	}

	public void assertEqual(String s1, String s2, String tag) {
		if (!s1.equals(s2)) {
			System.out.printf("%s [%s %s]%n", tag, s1, s2); System.exit(1);
		}
	}

	public void assertEqual(String s1, String s2, int v1, int v2,
						      String tag) {
		if (v1 != v2 || !s1.equals(s2)) {
			System.out.printf("%s [%s %s] [%d %d]%n", tag, s1, s2, v1, v2);
			System.exit(1);
		}
	}

	public void assertConsistent(String tag) {
		if (!consistent()) {
			System.out.printf("%s%n", tag); System.exit(1);
		}
	}
}
