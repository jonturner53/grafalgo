/** \file Testing.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 *
 *  This module provides components used for testing.
 */

import { AssertFail } from './Assert.mjs';

export class Mismatch extends Error {
  constructor(message) {
    super(message); this.name = 'Mismatch';
  }
}

export class Proceed extends Error {
  constructor(message) {
    super(message); this.name = 'Proceed';
  }
}

/** Confirm equivalence of two values.
 *  This method is used in unit-testing of data structures to confirm
 *  that two values are equivalent. If they are not, a Mismatch exception
 *  is thrown.
 *  @param a is an object (assumed to have an equals method), number
 *  or string.
 *  @param b is also an object, number or string, which can be compared
 *  to a for equivalence (possibly using a's equals method).
 *  @param tag is a string; if a and b are not equivalent, a Mismatch
 *  exception is thrown, with a string constructed from the tag and
 *  the mismatched values.
 */ 
export function matches(a, b, tag) {
	if (typeof a != 'object') {
		if (a != b) throw new Mismatch(`${tag} ${a} ${b}`);
	} else if (!a.equals(b)) {
		throw new Mismatch(`${tag} ${a.toString()} ${b.toString()}`);
	}
}

/** The Tester class is used for unit testing of algorithms.
 *  It allows a client to define a series of test cases and run the tests
 *  against multiple algorithms for a given problem (for example, one can
 *  use it to test several algorithms for minimum spanning tree on the same
 *  input graphs). If the client provides a verification method, it will
 *  also apply that method to the result returned by the algorithm.
 */
export class Tester {
	testcases;		// array of test cases to run
	verify;			// function used to check test results
	algorithms;		// array of algorithms specified on client command line
	trace;			// true if command line includes 'trace' argument
	stats;			// true if command line includes 'stats' argument
	
	/** Constructor for Tester object.
	 *  @param args is the command line arguments of the caller in node;
	 *  in the web app, args is the contents of the arguments textbox;
	 *  these are assumed to include the unique tag that identifies
	 *  a specific algorithm to be tested (so for mstK, it would be K),
	 *  plus optional "trace" or "stats" arguments
	 *  @param algomap maps the tag used to identify a specific algorithm
	 *  to a triple [name,func,vfy] where name is string naming an algorithm,
	 *  func is a function reference for the algorithm and vfy is a
	 *  reference to a verification function. So for mstK, the triple
	 *  would be ['mstK',mstK,mstVerify].
	 */
	constructor(args, algomap) {
		this.testcases = []; this.algorithms = [];

		this.trace = (args.indexOf('trace') >= 0);
		this.stats = (args.indexOf('stats') >= 0);
		let all = (args.indexOf('all') >= 0);
	
		// build array of algorithms to run
		for (let key of Object.keys(algomap)) {
			for (let arg of args) {
				if (all || arg.toLowerCase() == key.toLowerCase()) {
					let [name,func,vfy] = algomap[key];
					this.algorithms.push(
						{'name': name, 'func': func, 'vfy': vfy});
					break;
				}
			}
		}
	}

	/** Add test case to test suite prior to running tests.
	 *  @param label is the label of the test case;
	 *  @param args is the list of arguments that are to be passed
	 *  to the algorithm being tested
	 *  
     */
	addTest(label, ...args) {
		this.testcases.push({'label': label, 'args': args});
	}

	log() {
		if (typeof window === 'undefined') {
			// running in node.js
			console.log(...arguments);
		} else {
			// running in browser
			let s = '';
			for (let i = 0; i < arguments.length; i++)
				s += arguments[i] + ' ';
			outputArea.value += s + '\n';
		}
	}

	run() {
		let namelist = ''
		for (let algo of this.algorithms) namelist += ' ' + algo.name;
		this.log('testing' + namelist);

		for (let tcase of this.testcases) {
			// run each test case using each of the specified algorithms
			let small = tcase.label.startsWith('small');
			for (let algo of this.algorithms) {
				let tag = `${algo.name}(${tcase.label})`
				let t0; let t1; let results;
				try {
					t0 = Date.now();
					results = algo.func(...tcase.args, this.trace && small);
					t1 = Date.now();
				} catch(e) {
					if (e instanceof Proceed) {
						if (e.message && (this.trace || this.stats)) 
							this.log(`${tag} ${e.message}`);
						continue;
					}
					if (e instanceof AssertFail) {
						this.log(`${tag} ${e.message}`);
					}
					throw(e);
				}
				let traceString = results[results.length-2];
				if (this.trace && small)
					this.log(`${tag}\n${traceString}`);

				let statsString = JSON.stringify(results[results.length-1],fmt);
				if (this.stats)
					this.log(`${algo.name}(${tcase.label}), ` +
								`${t1-t0}ms, ${statsString}`);

				if (algo.vfy) {
					let s = algo.vfy(...tcase.args, ...results);
					if (s.length > 0) this.log(`${tag}.verify ${s}`);
				}
			}
		}
	}
}

function fmt(key,value) {
	if (typeof value === 'number' && !Number.isInteger(value)) {
		let v = Math.abs(value);
		let d = (v >= 100 ? 0 : (v >= 10 ? 1 : (v >= 1 ? 2 : 4)));
		return value.toFixed(d);
	}
	return value;
}
