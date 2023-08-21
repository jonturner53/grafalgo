#! /usr/local/bin/node

/** \file becolor.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import randomCase from '../randomCase.mjs';
import hardCase from '../hardCase.mjs';
import degreeBound from '../degreeBound.mjs';
import matchBound from '../matchBound.mjs';
import flowBound from '../flowBound.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomSample } from '../../../common/Random.mjs';
import { randomBigraph,randomRegularBigraph }
		from '../../../graphAlgorithms/misc/RandomGraph.mjs';

let g = new Graph();
g.fromString('{a[f:1 g:3 j:4] b[g:2 h:3 i:1] c[f:2 i:3 j:4] ' +
			 'd[f:4 h:2 j:3] e[h:1 i:2]}');
console.log('small graph\n',
		g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`) +
		'lowerBounds:', degreeBound(g), matchBound(g), flowBound(g), '\n');

g = randomCase(12,3,1,2);
console.log('small random (12,3,1,2)\n',
		g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`) +
		'lowerBounds:', degreeBound(g), matchBound(g), flowBound(g), '\n');

for (let e = g.first(); e; e = g.next(e)) g.bound(e, 1 + 1.5*(g.bound(e)-1));
console.log('small random with speedup (12,3,1.5,2)\n',
		g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`) +
		'lowerBounds:', degreeBound(g), matchBound(g), flowBound(g), '\n');

g = hardCase(8,1);
console.log('small hard (8,1)\n',
		g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`) +
		'lowerBounds:', degreeBound(g), matchBound(g), flowBound(g));

g = hardCase(8,1.5);
console.log('\nsmall hard with speedup (8,1.5)\n',
		g.toString(1,(e,u)=>`${g.x2s(g.mate(u,e))}:${g.bound(e)}`) +
		'lowerBounds:', degreeBound(g), matchBound(g), flowBound(g));

g = hardCase(16,1);
console.log('\nmedium hard (16,1):',
			degreeBound(g), matchBound(g), flowBound(g));

g = hardCase(16,1.5);
console.log('medium hard with speedup (16,1.5):',
			degreeBound(g), matchBound(g), flowBound(g));

g = hardCase(64,1);
console.log('large hard (64,1):',
			degreeBound(g), matchBound(g), flowBound(g));

g = hardCase(64,1.5);
console.log('large hard with speedup (64,1.5):',
			degreeBound(g), matchBound(g), flowBound(g));
