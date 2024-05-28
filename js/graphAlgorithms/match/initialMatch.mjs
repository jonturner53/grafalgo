/** @file initialMatch.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Matching from './Matching.mjs';

/** Compute an initial matching for a graph.
 *  @return the matching
 */
export default function initialMatch(g,match=0) {
	if (!match) match = new Matching(g);
return match;

	// add edges to match, yielding maximal (not maximum) matching
    for (let u = 1; u <= g.n; u++) {
        if (match.at(u)) continue;
        for (let e = g.firstAt(u); e != 0; e = g.nextAt(u,e)) {
            let v = g.mate(u,e);
            if (!match.at(v)) { match.add(e); break; }
        }
    }
	return match;
}
