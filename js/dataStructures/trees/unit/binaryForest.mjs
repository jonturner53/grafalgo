/** \file binaryForest.mjs
 *
 *  @author Jon Turner
 *  @date 2021
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import { AssertFail } from '../../../common/Assert.mjs';
import { matches, Mismatch } from '../../../common/Testing.mjs';
import BinaryForest from '../BinaryForest.mjs';

try {
	console.log('testing BinaryForest');

	let f = new BinaryForest();
	matches(f.fromString(
			'{[a *b (c d e)] [((h i -) j k) *l ((m n -) o (- p (q r -)))]}'),
			true, 'a0');
	matches(f,'{[a *b (c d e)] ' +
			  '[((h i -) j k) *l ((m n -) o (- p (q r -)))]}', 'a1');
	matches(f.singleton(6),true,'a2');
	matches(f.singleton(13),false,'a3');
	matches(f.left(4),3,'a4');
	matches(f.right(15),16,'a5');
	matches(f.p(16),15,'a5');
	matches(f.gp(16),12,'a6');
	matches(f.sibling(16),14,'a7');
	matches(f.innerChild(4),3,'a8');
	matches(f.outerChild(4),5,'a9');
	matches(f.nephew(1),5,'a10');
	matches(f.niece(1),3,'a11');
	matches(f.aunt(3),1,'a12');
	matches(f.innerGrandchild(11),true,'a12');
	matches(f.outerGrandchild(11),false,'a13');
	matches(f.innerGrandchild(8),false,'a15');
	matches(f.outerGrandchild(8),true,'a16');
	matches(f.root(17),12,'a17');

	matches(f.first(12),8,'b1');
	matches(f.next(11),12,'b2');
	matches(f.prev(13),12,'b3');
	matches(f.next(18),0,'b4');
	matches(f.prev(1),0,'b5');

	f.swap(12,15);
	matches(f,'{[a *b (c d e)] ' +
			  '[((h i -) j k) *o ((m n -) l (- p (q r -)))]}', 'c1');
	f.cut(10);
	matches(f,'{[a *b (c d e)] [(h i -) *j k] ' +
			  '[- *o ((m n -) l (- p (q r -)))]}', 'c2');
	f.link(2,6,-1);
	matches(f,'{[(a b (c d e)) *f -] ' +
			  '[(h i -) *j k] ' +
			  '[- *o ((m n -) l (- p (q r -)))]}', 'c3');
	let [t1,t2] = f.split(12);
	matches(t1,15,'c4'); matches(t2,16,'c5');
	matches(f,'{[(a b (c d e)) *f -] ' +
			  '[(h i -) *j k] ' +
			  '[- *o (m n -)] ' +
			  '[- *p (q r -)]}', 'c6');
	let t = f.join(6,7,10);
	matches(t,7,'c7');
	matches(f,'{[((a b (c d e)) *f -) g ((h i -) j k)] ' +
			  '[- *o (m n -)] ' +
			  '[- *p (q r -)]}', 'c8');
	t = f.append(15,16);
	matches(t,14,'c9');
	matches(f,'{[((a b (c d e)) f -) *g ((h i -) j k)] ' +
			  '[(- o m) *n (- p (q r -))]}', 'c10');
	f.swap(2,4);
	matches(f.listEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		  	 '[(o m -) *n (p q r)]}'), false, 'd6');
	matches(!!f.setEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		      '[(o m -) *n (p q r)]}'), true, 'd7');
	matches(f.setEquals('{[(a b (c d (e f -))) *g ((h i -) j k)] ' +
			 		     '[(o m -) *n (- q r)]}'), false, 'd8');

	matches(f,'{[((a d (c b e)) f -) *g ((h i -) j k)] ' +
			 '[(- o m) *n (- p (q r -))]}', 'e1');
	f.delete(7);
	matches(f,'{[(- o m) *n (- p (q r -))] [(a d (c b e)) *f ((h i -) j k)]}',
			 'e2');
	matches(f.verify(), '', 'e3');

	f.fromListString('{[a b c d] [e f g] [h i j k l m n] [p q r]}');
	matches(f,'{[- *a (- b (- c d))] [- *e (- f g)] ' +
			   '[- *h (- i (- j (- k (- l (- m n)))))] [- *p (- q r)]}', 'f1');
	matches(f.toString(0),'{[a b c d] [e f g] [h i j k l m n] [p q r]}', 'f2');

	let key = new Float32Array(18);
	for (let i = 0; i <= 18; i++) key[i] = i;
	matches(f.search(9,8,key), 9, 'f3');

	key[15] = 10.5;
	f.insertByKey(15, 13, key);
	matches(f,'{[- *a (- b (- c d))] [- *e (- f g)] ' +
			   '[- *h (- i (- j (- k (- l (o m n)))))] [- *p (- q r)]}', 'f4');

	f.insertAfter(10, 11, f.delete(10));
	matches(f,'{[- *a (- b (- c d))] [- *e (- f g)] ' +
			   '[- *h (- i (- k (j l (o m n))))] [- *p (- q r)]}', 'f5');

	f.property(f.root(4),3); f.property(f.root(14),13);
	let f2 = new BinaryForest();
	let prop = [];
	let treeProp = ((t,sc) => {
						let p = sc.nextInt();
						p = isNaN(p) ? 0 : p;
						prop.push([t,p]);
						return true;
					});
	matches(f2.fromString('{[- *a (- b (- c d))]3 [- *e (- f g)] ' +
				   		  '[- *h (- i (- k (j l (o m n))))]13 [- *p (- q r)]}',
				   		  0, treeProp), true, 'f6');
	for (let [t,p] of prop) f2.property(t,p);
	matches(f, f2, 'f7');

	let compare = (a,b) => a.localeCompare(b);
	f = new BinaryForest();
	key = [ '', 'abc', 'bcd', 'cde', 'def' ];
	f.insertByKey(1, f.root(1), key, compare);
	f.insertByKey(2, f.root(1), key, compare);
	f.insertByKey(3, f.root(1), key, compare);
	f.insertByKey(4, f.root(1), key, compare);
	matches(f.toString(4),'{[- *a (- b (- c d))]}','f8');

} catch(e) {
    if (e instanceof Mismatch) {
        console.log(e.name + ': ' + e.message);
	} else if (e instanceof AssertFail) {
		console.error(e.stack);
	} else {
        throw(e);
	}
}
