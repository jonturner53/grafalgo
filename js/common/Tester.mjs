/** \file Tester.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from './Errors.mjs';

export default class Tester {
	testcases;		// array of test cases to run
	verify;			// function used to check test results
	algorithms;		// array of algorithms specified on client command line
	trace;			// true if command line includes 'trace' argument
	stats;			// true if command line includes 'stats' argument
	
	/** Constructor for Tester object.
	 *  @param args is the command line arguments of the caller in node;
	 *  in the web app, args is the contents of the arguments testbox
	 *  @param prefix is the initial part of the name of the functions to
	 *  be tested; for example when testing maxflow functions, use 'maxflow'.
	 *  @param algomap maps the part of a function name that follows the prefix
	 *  to a function reference; for example algomap['D'] is the function
	 *  maxflowD, when testing maxflow functions
	 *  @param verify is a function that can be used to check the results
	 *  from a function being tested
	 */
	constructor(args, prefix, algomap, verify=null) {
		this.testcases = []; this.algorithms = []; this.verify = verify;

		this.trace = (args.indexOf('trace') >= 0);
		this.stats = (args.indexOf('stats') >= 0);
		let all = (args.indexOf('all') >= 0);
	
		// build array of algorithms to run
		for (let key of Object.keys(algomap)) {
			for (let arg of args) {
				if (all || arg.toLowerCase() == key.toLowerCase()) {
					this.algorithms.push({'name': prefix+key,
									 	 'code': algomap[key]});
					break;
				}
			}
		}
	}

	/** Add test case to test suite prior to running tests. */
	addTest(name) {
		this.testcases.push({'name': name, 'args': [... arguments].slice(1)});
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
		this.log('running tests');
		for (let tcase of this.testcases) {
			let small = tcase.name.startsWith('small');
			for (let algo of this.algorithms) {
				let tag = `${algo.name}(${tcase.name})`
				let t0; let t1; let results;
				try {
					t0 = Date.now();
					results = algo.code(...tcase.args, this.trace && small);
					t1 = Date.now();
				} catch(e) {
					if (e instanceof AssertError) {
						if (e.message.length > 0) {
							this.log(
								`${tag} ${e.message}`);
							continue;
						} else {
							console.log(e.stack); throw(e);
						}
					} else {
						console.log(e.stack);
						throw(e);
					}
				}
				let traceString = results[results.length-2];
				if (this.trace && small)
					this.log(`${tag}\n${traceString}`);

				let statsString = JSON.stringify(results[results.length-1]);
				if (this.stats)
					this.log(`${algo.name}(${tcase.name}), ` +
								`${t1-t0}ms, ${statsString}`);

				if (this.verify) {
					let s = this.verify(...tcase.args, ...results);
					if (s.length > 0) this.log(`${tag}.verify ${s}`);
				}
			}
		}
		this.log('tests completed');
	}
}
