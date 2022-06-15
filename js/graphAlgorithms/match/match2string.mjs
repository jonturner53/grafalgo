/** @file match2string.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

export default function match2string(g, medge) {
	let s = '['; let first = true;
	for (let e = g.first(); e != 0; e = g.next(e)) {
		if (medge[g.left(e)] == e) {
			if (first) first = false;
			else s += ' ';
			s += g.edge2string(e);
		}
	}
	return s + ']';
}
