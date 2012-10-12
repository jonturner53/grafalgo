/** @file Util.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package algoLib.misc;
import java.io.*;
import java.util.*;

public class Util {
	public static final int BIGINT = Integer.MAX_VALUE;

	public static void warning(String msg) {
		System.err.println("Warning: " + msg);
	}

	public static void fatal(String msg) {
		System.err.println("Fatal: " + msg);
		System.exit(1);
	}

	public static class MutableInt { public int val; }
	public static class MutableDouble { public double val; }
	public static class MutableString { public String val; }

	private static Random myRand = null;

	// Set the seed for the random number generator, myRand.
	public static void setSeed(long seed) {
		if (myRand == null) myRand = new Random();
		myRand.setSeed(seed);
	}
	
	// Return a random number in [0,1] 
	public static double randfrac() {
		if (myRand == null) myRand = new Random();
		return myRand.nextDouble();
	}
	
	// Return a random integer in the range [lo,hi].
	public static int randint(int lo, int hi) {
		if (myRand == null) myRand = new Random();
		return lo + myRand.nextInt((hi+1) - lo);
	}
	
	// Return a random number from an exponential distribution with mean mu 
	public static double randexp(double mu) {
		if (myRand == null) myRand = new Random();
		return -mu*Math.log(myRand.nextDouble());
	}
	
	/** Return a random number from a geometric distribution.
	 *  @param p is 1/(the mean of the distribution)
	 *  @return a random sample
	 */
	public static int randgeo(double p) {
		if (myRand == null) myRand = new Random();
		if (p > .999999) return 1;
		double x;
		x = (.999999 + Math.log(myRand.nextDouble())/Math.log(1-p));
		return Math.max(1,(int) x);
	}
	
	/** Return a random number from a truncated geometric distribution.
	 *  @param p is 1/(the mean of the distribution)
	 *  @param k is the max value in the distribution
	 *  @return a random sample
	 */
	public static int randTruncGeo(double p, int k) {
		if (myRand == null) myRand = new Random();
		double x = 1 - Math.exp((k-1)*Math.log(1-p));
		double r;
		r = .999999 + Math.log(myRand.nextDouble()/x)/Math.log(1-p);
		return ((p > .999999) ? 1 : Math.max(1,Math.min((int) r,k)));
	}
	
	/** Return a random number from a Pareto distribution.
	 *  @param mu is the mean of the distribution
	 *  @param s is the shape parameter
 	 *  @return a random sample
	 */
	public static double randpar(double mu, double s) {
		if (myRand == null) myRand = new Random();
		return mu*(1-1/s)/Math.exp((1/s)*Math.log(myRand.nextDouble()));
	}
	
	/** Convert a small integer to a lower-case letter.
	 *  @param u is an integer in the range 1..26
	 *  @return the corresponding lower-case letter
	 *  (1 becomes 'a', 2 becomes 'b', etc)
	 */
	public static char nam(int u) {
		return (char) (u + ((int) ('a'-1)));
	}
	
	/** Convert a lower-case letter to a small integer.
	 *  @param c is a lower-case letter
	 *  @return the corresponding integer
	 *  ('a' becomes 1, 'b' becomes 2, etc)
	 */
	public static int num(char c) { return ((int) c - ('a'-1)); }
	
	/** Create a String representation of a data structure node.
	 *  @param u is the node
	 *  @param n is the number of nodes in the data structure;
	 *  if 1 <= n <= 26, a single lower case character is returned
	 *  as the String; otherwise, the numeric value of u is added
	 *  @param s points to the String to be in which the value is returned
	 *  @param return a reference to the modified String
	 */
	public static String node2string(int u, int n) {
		String s;
	        if (1 <= n && n <= 26) s = "" + nam(u);
		else s = "" + u;
		return s;
	}
	
	/** Create random permutation on integers 1..n and return in p.
	 */
	public static void genPerm(int n, int p[]) {
	        int i, j, k;
	        for (i = 1; i <= n; i++) p[i] = i;
	        for (i = 1; i <= n; i++) {
	                j = randint(i,n);
	                k = p[i]; p[i] = p[j]; p[j] = k;
	        }
	}


	/** Create a 32 bit integer representation of an IPv4 address from
	 *  a String.
	 *  @param s is the string to be converted
	 *  @return an integer represention of the IP address or 0 if the
	 *  string does not represent a valid address
	 */
	public static int string2ipAdr(String s) {
		String parts[] = s.split("[.]");
		if (parts.length != 4) return 0;
		int[] p = new int[4];
		p[0] = Integer.parseInt(parts[0]);
		p[1] = Integer.parseInt(parts[1]);
		p[2] = Integer.parseInt(parts[2]);
		p[3] = Integer.parseInt(parts[3]);
		for (int i = 0; i < 4; i++)
			if (p[i] < 0 || p[i] > 255) return 0;
		return (p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3];
	}

	public static String ipAdr2string(int ip) {
		String s = "" + ((ip >> 24) & 0xff) + "." + ((ip >>16) & 0xff)
			   + "." + ((ip >>  8) & 0xff) + "." + (ip & 0xff);
		return s;
	}

	/** Read up to first occurrence of a given character.
	 *  @param in is the input stream to read from
	 *  @param c is character to look for
	 *  @return c or 0, on end-of-file
	 */
	public static int readNext(PushbackReader in, int c) {
		try {
		for (int cc = in.read(); cc != -1; cc = in.read()) {
			if (cc == c) return c;
		}
		return 0;
		} catch(Exception e) { return 0; }
	}
	
	/** Skip over all occurrences of any character from a given string.
	 *  @param in is the input stream to read from
	 *  @param s  is a string containing characters to be skipped
	 */
	public static void skip(PushbackReader in, String s) {
		try {
		for (int cc = in.read(); cc != -1; cc = in.read()) {
			if (s.indexOf(cc) == -1) {
				in.unread(cc); return;
			}
		}
		} catch(Exception e) { return; }
	}
	
	private static final String alpha = "abcdefghijklmnopqrstuvwxyz";
	private static final String digits = "0123456789";
	private static final String wordChars = alpha
		+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + digits + "_/";

	/** Read a data structure "node" from the input.
	 *  For data structures with at most 26 nodes, the next alphabetic
	 *  character in the input stream is interpreted as a node name.
	 *  Otherwise, the next integer value is interpreted as a node number.
	 *  @param in is the input stream to read from
	 *  @param n is the number of nodes in the data structure
	 *  @return the node number on success, 0 if the next item in
	 *  the input cannot be interpreted as a node and -1 on end-of-file
	 */
	public static int readNode(PushbackReader in, int n) {
		skip(in," \t\n");
		if (n <= 26) {
			int cc = readAlpha(in);
			if (cc <= 0) return cc;
			return cc;
		}
		MutableInt num;
		num = new MutableInt();
		return (readNum(in,num) ? num.val : 0);
	}

	/** Read a lower-case letter and return as integer index.
	 *  If the next non-whitespace character in the input is
	 *  a lower-case character, read it and return the corresponding
	 *  integer index (1 for 'a', 2 for 'b', etc).
	 *  @param in is an open input stream
	 *  @return the integer value or 0 if the next non-whitespace character
	 *  is not a lower-case character, or -1 on end-of-file.
	 */
	public static int readAlpha(PushbackReader in) {
		try {
		skip(in," \t\n");
		int cc = in.read();
		if (cc == -1) return -1;
		if (alpha.indexOf(cc) != -1) return (cc + 1) - 'a';
		in.unread(cc); return 0;
		} catch(Exception e) { return -1; }
	}

	/** Read an unsigned integer.
	 *  If the next non-whitespace character in the input is a digit or
	 *  a minus sign, read a number.
	 *  @param in is an open input stream
	 *  @param num is a mutable integer object in which the value is
	 *  returned
	 *  @return true on success, false on failure
	 */
	public static boolean readNum(PushbackReader in, MutableInt num) {
		try {
		skip(in," \t\n");
		String numString = "";
		int cc = in.read();
		if (cc == -1) return false;
		if (cc == '-') numString += "-";
                else in.unread((char) cc);
		for (cc = in.read(); cc != -1; cc = in.read()) {
			if (digits.indexOf(cc) == -1) {
				in.unread(cc);
				if (numString.length() == 0 ||
				    (numString.length() == 1 &&
				     numString.charAt(0) == '-'))
					return false;
				num.val = Integer.parseInt(numString);
				return true;
			}
			numString += (char) cc;
		}
		if (numString.length() == 0 ||
		    (numString.length() == 1 && numString.charAt(0) == '-'))
			return false;
		num.val = Integer.parseInt(numString);
		return true;
		} catch(Exception e) { return false; }
	}

	/** Read a signed floating point falue.
	 *  If the next non-whitespace character in the input is a digit,
	 *  or a minus sign, read a number.
	 *  @param in is an open input stream
	 *  @param num is a mutable double object in which the value is
	 *  returned
	 *  @return true on success, false on failure
	 */
	public static boolean readDouble(PushbackReader in, MutableDouble num) {
		try {
		skip(in," \t\n");
		String numString = "";
		int cc = in.read();
		if (cc == -1) return false;
		if (cc == '-') numString += "-";
		else in.unread(cc);
		boolean seenPoint = false;
		for (cc = in.read(); cc != -1; cc = in.read()) {
			if (digits.indexOf(cc) == -1) {
				if (cc == '.' && !seenPoint) {
					seenPoint = true;
				} else {
					in.unread(cc);
					if (numString.length() == 0 ||
					    (numString.length() == 1 &&
					     numString.charAt(0) == '-'))
						return false;
					if (numString.length() == 0)
						return false;
					num.val = Double.parseDouble(numString);
					return true;
				}
			}
			numString += (char) cc;
		}
		if (numString.length() == 0 ||
		    (numString.length() == 1 && numString.charAt(0) == '-'))
			return false;
		num.val = Double.parseDouble(numString);
		return true;
		} catch(Exception e) { return false; }
	}
	/** Read an Ip address in dotted-decimal notation.
	 *  @param in is a PushbackReader for an open input stream
	 *  @return the IP address as an integer on success,
	 *  0 on failure (0 is not a valid IP address);
	 *  if the first nonblank character is not a digit, it is not read;
	 *  if it is a digit, the method attempts to interpret the input
	 *  as an IP address and all characters that could be part of
	 *  a valid address are read
	 */
	public static int readIpAdr(PushbackReader in) {
		try{
		skip(in," \t\n");
		int cc; cc = in.read();
		if (digits.indexOf(cc) == -1) {
			in.unread(cc); return 0;
		}
		String s = "" + (char) cc;
		int dotCnt = 0;
		for (cc = in.read(); cc != -1; cc = in.read()) {
			if (digits.indexOf(cc) != -1) {
				s += (char) cc;
			} else if (cc == '.' && dotCnt < 3) {
				dotCnt++; s += (char) cc;
			} else {
				in.unread(cc);
				return string2ipAdr(s);
			}
		}
		return 0;
		} catch(Exception e) { return 0; }
	}
	
	/** Test if one string is a prefix of another.
	 *  @param s1 is a reference to a string
	 *  @param s2 is a reference to another string
	 *  @return true if s1 is a non-empty prefix of s2, else false.
	 */
	public static boolean prefix(String s1, String s2) {
		return s1.length() > 0 && s2.indexOf(s1) == 0;
	}
	
	/** Read next word (string containing letters, numbers, underscores,
	 *  slashes) on the current line and return it in s.
 	 *  @param in is a PushbackReader for an input stream
	 *  @return the matching word on success, or null on error
	 */
	public static String readWord(PushbackReader in) {
		try {
		skip(in," \t\n");
		String s = "";
		for (int c = in.read(); c != -1; c = in.read()) {
			if (wordChars.indexOf(c) == -1) {
				in.unread(c);
				return (s.length() == 0 ? null : s);
			}
			s += (char) c;
		}
		return s;
		} catch(Exception e) { return null; }
	}
	
	/** Advance to the first non-blank character, skipping over comments.
	 *  Leave the non-blank character in the input stream.
	 *  A comment is anything that starts with the sharp sign '#' and
	 *  continues to the end of the line. Return false on error or eof.
	 */
	public static boolean skipBlank(PushbackReader in) {
		try {
		while (true) {
			skip(in," \t\n");
			int c = in.read();
			if (c == -1) return false;
			if (c != '#') { in.unread(c); return true; }
			readNext(in,'\n');
		}
		} catch(Exception e) { return false; }
	}
	
	/** Verify the next non-space input character.
	 *  @param in is an open input stream
	 *  @param c is the expected next non-blank character
	 *  @return true if c is encountered after 0 or more spaces or tabs,
	 *  else false; if the first non-(space or tab) character matches c,
	 *  it is read and discarded, otherwise it is left in the input stream
	 */
	public static boolean verify(PushbackReader in, int c) {
		try {
		skip(in," \t\n");
		int cc = in.read();
		if (cc == -1) return false;
		if (cc == c) return true;
		in.unread(cc);
		return false;
		} catch(Exception e) { return false; }
	}
}
