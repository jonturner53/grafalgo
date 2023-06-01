/** \file binaryForest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { assert, AssertError } from '../../../common/Errors.mjs';
import BinaryForest from '../BinaryForest.mjs';

try {
	console.log('testing BinaryForest');

	let f = new BinaryForest();
	assert(f.fromString('{[a *b (c d e)] ' +
						'[((h i -) j k) *l ((m n -) o (- p (q r -)))]}'), 'a0');
	assert(f,'{[a *b (c d e)] ' +
			  '[((h i -) j k) *l ((m n -) o (- p (q r -)))]}', 'a1');
	assert(f.singleton(6),true,'a2');
	assert(f.singleton(13),false,'a3');
	assert(f.left(4),3,'a4');
	assert(f.right(15),16,'a5');
	assert(f.p(16),15,'a5');
	assert(f.gp(16),12,'a6');
	assert(f.sibling(16),14,'a7');
	assert(f.innerChild(4),3,'a8');
	assert(f.outerChild(4),5,'a9');
	assert(f.nephew(1),5,'a10');
	assert(f.niece(1),3,'a11');
	assert(f.aunt(3),1,'a12');
	assert(f.innerGrandchild(11),true,'a12');
	assert(f.outerGrandchild(11),false,'a13');
	assert(f.innerGrandchild(8),false,'a15');
	assert(f.outerGrandchild(8),true,'a16');
	assert(f.root(17),12,'a17');

	assert(f.first(12),8,'b1');
	assert(f.next(11),12,'b2');
	assert(f.prev(13),12,'b3');
	assert(f.next(18),0,'b4');
	assert(f.prev(1),0,'b5');

	f.swap(12,15);
	assert(f,'{[a *b (c d e)] ' +
			  '[((h i -) j k) *o ((m n -) l (- p (q r -)))]}', 'c1');
	f.cut(10);
	assert(f,'{[a *b (c d e)] [(h i -) *j k] ' +
			  '[- *o ((m n -) l (- p (q r -)))]}', 'c2');
	f.link(2,6,-1);
	assert(f,'{[(a b (c d e)) *f -] ' +
			  '[(h i -) *j k] ' +
			  '[- *o ((m n -) l (- p (q r -)))]}', 'c3');
	let [t1,t2] = f.split(12);
	assert(t1,15,'c4'); assert(t2,16,'c5');
	assert(f,'{[(a b (c d e)) *f -] ' +
			  '[(h i -) *j k] ' +
			  '[- *o (m n -)] ' +
			  '[- *p (q r -)]}', 'c6');
	let t = f.join(6,7,10);
	assert(t,7,'c7');
	assert(f,'{[((a b (c d e)) *f -) g ((h i -) j k)] ' +
			  '[- *o (m n -)] ' +
			  '[- *p (q r -)]}', 'c8');
	t = f.append(15,16);
	assert(t,14,'c9');
	assert(f,'{[((a b (c d e)) f -) *g ((h i -) j k)] ' +
			  '[(- o m) *n (- p (q r -))]}', 'c10');
	f.swap(2,4);
	assert(!f.listEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		  	 '[(o m -) *n (p q r)]}'), 'd6');
	assert(f.setEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		    '[(o m -) *n (p q r)]}'), 'd7');
	assert(!f.setEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		     '[(o m -) *n (- q r)]}'), 'd8');

	assert(f,'{[((a d (c b e)) f -) *g ((h i -) j k)] ' +
			 '[(- o m) *n (- p (q r -))]}', 'e1');
	f.delete(7);
	assert(f,'{[(- o m) *n (- p (q r -))] [(a d (c b e)) *f ((h i -) j k)]}',
			 'e2');
	assert(!f.verify(), 'e3');

	f.fromListString('{[a b c d] [e f g] [h i j k l m n] [p q r]}');
	assert(f,'{[(a b -) *c d] [e *f g] ' +
			  '[((((h i -) j -) k -) l -) *m n] [p *q r]}', 'f1');
	assert(f.toString(0),'{[a b *c d] [e *f g] [h i j k l *m n] [p *q r]}',
			'f2');

	let key = new Float32Array(18);
	for (let i = 0; i <= 18; i++) key[i] = i;
	assert(f.search(9,13,key), 9, 'f3');

	key[15] = 10.5;
	f.insertByKey(15, 13, key);
	assert(f,'{[(a b -) *c d] [e *f g] ' +
			  '[((((h i -) j o) k -) l -) *m n] [p *q r]}', 'f4');

	f.insertAfter(10, f.delete(10), 11);
	assert(f,'{[(a b -) *c d] [e *f g] [(((h i o) k j) l -) *m n] ' +
			 '[p *q r]}', 'f5');
	f.property(3,3); f.property(13,13);
	assert(f,'{3[(a b -) *c d] [e *f g] 13[(((h i o) k j) l -) *m n] ' +
			 '[p *q r]}', 'f5');

	let compare = (a,b) => a.localeCompare(b);
	f = new BinaryForest();
	key = [ '', 'abc', 'bcd', 'cde', 'def' ];
	f.insertByKey(1, 0, key, compare);
	f.insertByKey(2, 1, key, compare);
	f.insertByKey(3, 2, key, compare);
	f.insertByKey(4, 3, key, compare);
	assert(f.toString(4),'{[- *a (- b (- c d))]}','f5');

} catch(e) {
    if (e instanceof AssertError) {
		if (e.message.length != 0)
        	console.error(`${e.name}: ${e.message}`);
		else
			console.error(e.stack);
    } else {
        console.error(`${e.message}`);
		console.error(e.stack);
	}
}
