/** @file ListSet.mjs 
 *
 * @author Jon Turner
 * @date 2021
 * This is open source software licensed under the Apache 2.0 license.
 * See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

import Top from '../Top.mjs';
import List from './List.mjs';
import Scanner from './Scanner.mjs';

import { assert, EnableAssert as ea } from '../../common/Assert.mjs';

/** The ListSet class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. Each list in the collection is identified
 *  by its first item.
 */
export default class ListSet extends Top {
	Next;		// Next[i] is next item on list or 0 for last item
	Prev;		// Prev[i] is previous item on list or last for first item,
				// where last is the last item on the list

	constructor(n=10) {
		super(n);
		this.Next = new Int32Array(this.n+1);
		this.Prev = new Int32Array(this.n+1);
		// initialize to singleton lists
		this.Next.fill(0);
		for (let i = 0; i <= this.n; i++) this.Prev[i] = i;
	}

	assign(that, relaxed=false) {
		super.assign(that, relaxed);
		for (let i = 1; i <= that.n; i++) {
			this.Next[i] = that.Next[i]; this.Prev[i] = that.Prev[i];
		}
	}

	xfer(that) {
		super.xfer(that);
		this.Next = that.Next; this.Prev = that.Prev;
		that.Next = that.Prev = null;
	}
	
	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this.Next[i] = 0; this.Prev[i] = i;
		}
	}

	isfirst(i) {
		ea && assert(this.valid(i));
		return this.Next[this.Prev[i]] == 0;
	}
	
	/** Get the last item in a list.
	 *  @param f is the first item on a list.
	 *  @return the last item in the list
	 */
	last(f) {
		ea && assert(this.isfirst(f));
		return this.Prev[f];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @return the item that follows i in its list
	 */
	next(i) {
		ea && assert(this.valid(i));
		return this.Next[i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @return the item that precedes i in its list
	 */
	prev(i) {
		return (this.isfirst(i) ? 0 : this.Prev[i]);
	}

	/** Find the first item in a list. */
	find(i) {
		while (this.prev(i)) i = this.prev(i);
		return i;
	}

	/** Determine if an item is in a singleton list.
	 *  @param i is the index of an item
	 *  @return true if it is the only item in its list, else false
	 */
	singleton(i) {
		ea && assert(this.valid(i));
		return this.Prev[i] == i;
	}
	
	/** Rotate list to make i it's first item.
	 *  @param f is the first item on a list.
	 *  @param i is another item on the same list
	 *  @return the modified list
	 */
	rotate(f, i) {
		if (i == f) return i;
		this.Next[this.last(f)] = f;
		this.Prev[f] = this.Prev[f];
		this.Next[this.Prev[i]] = 0;
		return i;
	}
	
	/** Remove an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param f is the first item of a list
	 *  @return the first item of the modified list, or 0 if f was a singleton
	 */
	delete(i, f) {
		ea && assert(this.valid(i) && this.valid(f) && this.isfirst(f));
		if (this.singleton(f)) return 0;
		let l = this.last(f); let nf = this.next(f);
		let pi = this.prev(i); let ni = this.next(i);
		if (i == f) {
			this.Prev[nf] = this.Prev[f]; f = nf;
		} else if (i == l) {
			this.Prev[f] = pi; this.Next[pi] = 0;
		} else {
			this.Prev[ni] = pi; this.Next[pi] = ni;
		}
		this.Next[i] = 0; this.Prev[i] = i;
		return f;
	}
	
	/** Join two lists together.
	 *  @param f1 is the first item on a list
	 *  @param f2 is the first item on another list
	 *  @return the id of the list formed by joining the two lists;
	 *  defined to be f1, for non-zero f1
	 */
	join(f1, f2) {
		ea && assert(this.valid(f1) && this.valid(f2));
		if (f2 == 0 || f1 == f2) return f1;
		if (f1 == 0) return f2;
		let l1 = this.last(f1); let l2 = this.last(f2);
		this.Next[l1] = f2;
		this.Prev[f2] = l1;
		this.Prev[f1] = l2
		return f1;
	}

	/** Split a list at an item.
	 *  @param f is first item in a list
	 *  @param i is another item in f's list; this method divides f's list
	 *  into two parts, with the second part starting with i
	 */
	split(f, i) {
		ea && assert (this.valid(f) && this.valid(i) && this.isfirst(f));
		if (i == 0 || i == f) return;
		let p = this.prev(i);
		this.Prev[i] = this.last(f);
		this.Next[p] = 0; this.Prev[f] = p;
	}

	/** Sort the lists in ascending order.
	 *  @param cmp(a,b) is an optional comparison funcion used to compare two
	 *  items; it returns -1 if a<b, 0 if a=b and +1 if a>b. If no comparison
	 *  function is provided, the function (a,b) => a-b is used.
	 */
	sort(cmp=0) {
		if (!cmp) cmp = ((a,b) => a-b);
		let vec = [];
		for (let i = 1; i <= this.n; i++) {
			if (this.singleton(i) || !this.isfirst(i)) continue;
			let j = i; vec.length = 0;
			while (!this.singleton(j)) {
				vec.push(j); j = this.delete(j, j);
			}
			vec.push(j);
			vec.sort(cmp);
			for (j = 1; j < vec.length; j++)
				this.join(vec[0], vec[j])
		}
	}

	/** Determine if two ListSets are equal.
	 *  @param that is a second ListSet or a string representing a
	 *  ListSet object
	 *  @return true if the two ListSet objects contain identical lists.
	 */
	equals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		for (let i = 1; i < this.n; i++) {
			if (this.isfirst(i) != that.isfirst(i)) return false;
			if (!this.isfirst(i)) continue;
			let j1 = i; let j2 = i;
			do {
				j1 = this.next(j1); j2 = that.next(j2);
				if (j1 != j2) return false;
			} while (j1 != 0);
		}
		return that;
	}

	/** Determine if two ListSets define the same sets.
	 *  @param that is a second ListSet or a string representing a
	 *  ListSet object
	 *  @return true if the two ListSet objects define identical sets.
	 */
	setEquals(that) {
		that = super.equals(that);
		if (typeof that == 'boolean') return that;
		let l = new List(this.n);
		for (let i = 1; i < this.n; i++) {
			if (!this.isfirst(i)) continue;
			l.clear();
			for (let j = i; j; j = this.next(j)) l.enq(j);
			let lng = 0;
			for (let j = that.find(i); j; j = that.next(j)) {
				if (!l.contains(j)) return false;
				lng++;
			}
			if (lng != l.length) return false;
		}
		return that;
	}
	
	/** Produce a string representation of the object.
	 *  @param fmt is a pair of format bits that controls presentation
	 *     01 causes lists to be shown on separate lines
	 *     10 causes singletons to be shown explictly
	 *  @param label is a function used to label list items
	 *  @return a string such as "{[a c] [d b g]}".
	 */
	toString(fmt=0, label=0) {
		if (!label) label = (u => this.x2s(u));
		let s = '';
		for (let l = 1; l <= this.n; l++) {
			if (!this.isfirst(l) || (this.singleton(l) && !(fmt&0x2)))
				continue;
			if (!(fmt&1) && s.length) s += ' ';
			if (!this.singleton(l)) s += '[';
			for (let i = l; i; i = this.next(i)) {
				if (i != l) s += ' ';
				s += label(i);
			}
			if (!this.singleton(l)) s += ']';
			s += (fmt&0x1 ? '\n' : '');
		}
		return (fmt&0x1 ? `{\n${s}}\n` : `{${s}}`);
	}

	/** Initialize this from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @param prop is an optional function that is used to scan
	 *  for a property of a list item; it is called after each
	 *  list item is successfully called; its arguments are the
	 *  list item and a Scanner object
	 *  @return true on success, else false
	 */
	fromString(s,prop=0) {
		let sc = new Scanner(s);
		if (!sc.verify('{')) return false;
		let lists = []; let n = 0; let items = new Set();
		while (!sc.verify('}')) {
			let l;
			if (sc.verify('[')) {
				sc.reset(-1);
				l = sc.nextIndexList('[',']', prop);
			} else {
				let x = sc.nextIndex(prop);
				if (!x) return false;
				l = [x];
			}
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return false;
				items.add(i);
			}
			lists.push(l);
		}
		if (n != this.n) this.reset(n);
		else this.clear();
		for (let l of lists) {
			for (let i of l) {
				if (i != l[0]) this.join(l[0], i);
			}
		}
		return true;
	}
}
