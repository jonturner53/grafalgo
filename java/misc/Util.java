/** @file Util.java 
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

package grafalgo.misc;
import java.io.*;
import java.util.*;

public class Util {
	public static void warning(String msg) {
		System.err.println("Warning: " + msg);
	}

	public static void fatal(String msg) {
		System.err.println("Fatal: " + msg);
		System.exit(1);
	}

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

	/** Verify the next non-space input character.
	 *  @param in is a Scanner object
	 *  @param c is the expected next non-space character 
	 *  @param strict is an optional flag; if true, then we don't skip
	 *  over space characters; default is false
	 *  @return true if c is present in the input, else false;
	 *  if c is found, it is read and discarded, otherwise the 
	 *  character checked is left in the input stream
	 */	 
	boolean verify(Scanner in, char c, boolean strict) {
		if (!strict) in.skip("\\s");
		return in.findWithinHorizon("\\G" + c, 1) != null; 
	}   
	boolean verify(Scanner in, char c) { return verify(in, c, false); }
	
	/** Test if one string is a prefix of another.
	 *  @param s1 is a reference to a string
	 *  @param s2 is a reference to another string
	 *  @return true if s1 is a non-empty prefix of s2, else false.
	 */
	public static boolean prefix(String s1, String s2) {
		return s1.length() > 0 && s2.indexOf(s1) == 0;
	}
}
