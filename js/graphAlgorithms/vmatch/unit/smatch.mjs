/** \file smatch.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import { Tester, Proceed } from '../../../common/Testing.mjs';
import ListPair from '../../../dataStructures/basic/ListPair.mjs';
import smatchGS from '../smatchGS.mjs';
import smatchVerify from '../smatchVerify.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { scramble } from '../../../common/Random.mjs';
import { randomBigraph } from '../../misc/RandomGraph.mjs';

import findSplit from '../../misc/findSplit.mjs';

function randomInstance(n,d) {
	let g = randomBigraph(n,d);
	let subsets = new ListPair(g.n);
	for (let u = 1; u <= g.n/2; u++) subsets.swap(u);
	let pref = [[]];
	for (let u = 1; u <= g.n; u++) {
	    pref.push([0]);
	    for (let e = g.firstAt(u); e; e = g.nextAt(u,e))
	        pref[u].push(e);
	    scramble(pref[u]);
	}
	return [g,pref,subsets];
}

let algomap = {
	'GS' : ['smatchGS', smatchGS, smatchVerify]
}

let args = (typeof window==='undefined' ? process.argv.slice(2): argv.slice(0));
let tester = new Tester(args, algomap);

let [g,pref,subsets] = new randomInstance(5,2);
tester.addTest('small random bigraph', g, pref, subsets);

[g,pref,subsets] = new randomInstance(13,3);
tester.addTest('smallish random bigraph', g, pref, subsets);

[g,pref,subsets] = new randomInstance(5000,5);
tester.addTest('medium random bigraph', g, pref, subsets);

[g,pref,subsets] = new randomInstance(50000,20);
tester.addTest('large random bigraph', g, pref, subsets);

tester.run();
