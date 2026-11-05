/** \file map.mjs
 *
 *  @author Jon Turner
 *  @date 2022
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import Map from '../Map.mjs';
import Digraph from '../../graphs/Digraph.mjs';

try {
	console.log('testing Map');
	let m = Map.fromString('{22:2 21:1 24:4 23:3 28:8 27:7 25:10 29:9 26:6}',
						   11);
	matches(!!m, true, 'a0');
	matches(m, '{21:1 22:2 23:3 24:4 26:6 27:7 28:8 29:9 25:10}','a1');
	m.put(23,13); m.put(111,21); m.put(115,15);
	matches(m.size, 11, 'a2');
	matches(m, '{21:1 22:2 23:13 24:4 26:6 27:7 28:8 29:9 ' +
			   '25:10 111:21 115:15}', 'a3');
	m.delete(24);
	matches(m, '{21:1 22:2 23:13 26:6 27:7 28:8 29:9 ' +
			  '25:10 111:21 115:15}', 'a4');
	m.clear();
	matches(m, '{}', 'a5');

	m = Map.fromString('{"eleven":11 "twelve":12 "thirteen":13}',
						10, (a,b)=>a.localeCompare(b), (a,b)=>a==b);
	matches(!!m, true, 'b0');
	matches(m, '{"eleven":11 "twelve":12 "thirteen":13}', 'b1');
	matches(m.get('twelve'), 12, 'b2');

	m = Map.fromString('{11:[1,1] 12:[1,2] 13:[1,3]}',
						10, (a,b)=>a-b, (a,b)=>(a[0]==b[0] && a[1]==b[1]));
	matches(!!m,true,'b3');
	matches(m, '{11:[1,1] 12:[1,2] 13:[1,3]}', 'b4');

	m = Map.fromString('{11:{"x":1,"y":false} 12:{"x":1,"y":2} ' +
						  '13:{"x":1,"y":true}}',
						10, (a,b)=>a-b, (a,b)=>(a.x==b.x && a.y==b.y));
	matches(!!m, true, 'b5');
	matches(m, '{11:{"x":1,"y":false} 12:{"x":1,"y":2} 13:{"x":1,"y":true}}',
			'b6');
} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
