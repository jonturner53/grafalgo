#! /usr/local/bin/node

/** \file lowerBounds.mjs
 *
 *  @author Jon Turner
 *  @date 2023
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, EnableAssert as ea } from '../../../common/Assert.mjs';
import randomCase from '../becRandomCase.mjs';
import hardCase from '../becHardCase.mjs';
import degreeBound from '../becDegreeBound.mjs';
import matchBound from '../becMatchBound.mjs';
import flowBound from '../becFlowBound.mjs';
import Graph from '../../../dataStructures/graphs/Graph.mjs';
import { randomSample } from '../../../common/Random.mjs';

console.log('testing lower bounds for bounded edge coloring');

let g = hardCase(64,1);
let s = `${degreeBound(g)} ${matchBound(g)} ${flowBound(g)}`;
let sx = '64 80 83'
if (s != sx) console.log(`large hard (64,1) mismatch: ${s} not ${sx}`);

g = hardCase(64,1.5);
s = `${degreeBound(g)} ${matchBound(g)} ${flowBound(g)}`;
sx = '96 96 96';
if (s != sx) console.log(`large hard (64,1.5) mismatch: ${s} not ${sx}`);
