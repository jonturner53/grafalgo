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

import { assert, assertEnabled } from '../../common/Assert.mjs';
let ae; // initialized in constructor

/** The ListSet class maintains a collection of disjoint lists defined
 *  over a set of integers 1..n. Each list in the collection is identified
 *  by its first item.
 */
export default class ListSet extends Top {
	next_;		// next_[i] is next item on list or 0 for last item
	prev_;		// prev_[i] is previous item on list or last for first item,
				// where last is the last item on the list
	first_;		// first_[l] is the first item in the list numbered l

	/** constructor
	 *  @param n is index range for the items that appear on the lists
	 *  @param nl is the number of "numbered lists" that are hosted
	 *  by the list set; if nl=0, all lists are "anonymous" and can only
	 *  be identified by their first item; when numbered lists are present
	 *  the method firstInList(l) returns the first item in list l, allowing the
	 *  lists to be identified based on some client-specific handle
	 */
	constructor(n=10, nl=0, property=[]) {
		ae = assertEnabled();
		super(n,property);
		this.next_ = new Int32Array(this.n+1);
		this.prev_ = new Int32Array(this.n+1);
		this.first_ = new Int32Array(nl+1);
		// initialize to singleton lists
		this.next_.fill(0);
		for (let i = 0; i <= this.n; i++) this.prev_[i] = i;
	}

	get nl() { return this.first_.length - 1; }

	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		super.clear();
		for (let i = 1; i <= this.n; i++) {
			this.next_[i] = 0; this.prev_[i] = i;
		}
		if (this.first_) this.first_.fill(0);
	}

	get hasNumberedLists() { return this.first_.length > 1; }

	/** Get the first item in a numbered list.
	 *  @param l identifies a numbered list
	 *  @return the first item in list l
	 */
	firstInList(l) {
		ae && assert(this.first_ && l < this.first_.length,
					 `${l} [${this.first_}] ${this.first_.length}`);
		return this.first_[l];
	}

	/** Add an item to the end of a numbered list.
	 *  @param i is the first item of a list
	 *  @param l is a numbered list
	 */
	append(i,l) {
		ae && assert(this.first_ && l < this.first_.length &&
					 this.isfirst(i));
		this.first_[l] = this.join(this.first_[l], i);
	}

	/** Add an item to the front of a numbered list.
	 *  @param i is the first item of a list
	 *  @param l is a numbered list
	 */
	prepend(i,l) {
		ae && assert(this.first_ && l < this.first_.length &&
					 this.singleton(i));
		this.first_[l] = this.join(i, this.first_[l]);
	}

	/** Remove an item from a numbered list.
	 *  @param i is a list item
	 *  @param l is a numbered list
	 */
	remove(i, l) {
		ae && assert(this.first_ && l < this.first_.length,
				     `${i} ${l} ${this.first_}`);
		this.first_[l] = this.singleton(i) ? 0 :
						 this.delete(i, this.firstInList(l));
	}

	/** Determine if an item is the first in its list.
	 *  @param is a list item
	 *  @return true if i is the first item in its list
	 */
	isfirst(i) {
		ae && assert(this.valid(i));
		return this.next_[this.prev_[i]] == 0;
	}
	
	/** Get the last item in a list.
	 *  @param f is the first item on a list.
	 *  @return the last item in the list
	 */
	last(f) {
		ae && assert(this.isfirst(f),
						`${this.x2s(f)} ${this.isfirst(f)} ` +
						`${this.prev_[f]} ${this.next_[this.prev_[f]]}`);
		return this.prev_[f];
	}

	/** Get the next list item.
	 *  @param i is a list item
	 *  @return the item that follows i in its list
	 */
	next(i) {
		ae && assert(this.valid(i));
		return this.next_[i];
	}
	
	/** Get the previous list item.
	 *  @param i is a list item
	 *  @return the item that precedes i in its list
	 */
	prev(i) {
		return (this.isfirst(i) ? 0 : this.prev_[i]);
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
		ae && assert(this.valid(i));
		return this.prev_[i] == i;
	}
	
	/** Rotate list to make i it's first item.
	 *  @param f is the first item on a list.
	 *  @param i is another item on the same list
	 *  @param ln is the number of the list containing f and c
	 *  (if there is one)
	 *  @return the modified list
	 */
	rotate(f, i, ln=0) {
		if (i == f) return i;
		this.next_[this.last(f)] = f;
		this.prev_[f] = this.prev_[f];
		this.next_[this.prev_[i]] = 0;
		if (ln) this.first_[ln] = i;
		return i;
	}
	
	/** Delete an item from its list.
	 *  This method turns the deleted item into a singleton list.
	 *  @param i is an item in a list
	 *  @param f is the first item of a list
	 *  @return the first item of the modified list, or 0 if f was a singleton
	 */
	delete(i, f) {
		ae && assert(this.valid(i) && this.valid(f) && this.isfirst(f));
		if (this.singleton(f)) return 0;
		let l = this.last(f); let nf = this.next(f);
		let pi = this.prev(i); let ni = this.next(i);
		if (i == f) {
			this.prev_[nf] = this.prev_[f]; f = nf;
		} else if (i == l) {
			this.prev_[f] = pi; this.next_[pi] = 0;
		} else {
			this.prev_[ni] = pi; this.next_[pi] = ni;
		}
		this.next_[i] = 0; this.prev_[i] = i;
		return f;
	}
	
	/** Join two lists together.
	 *  @param f1 is the first item on a list
	 *  @param f2 is the first item on another list
	 *  @return the id of the list formed by joining the two lists;
	 *  defined to be f1, for non-zero f1
	 */
	join(f1, f2) {
		ae && assert(this.valid(f1) && this.valid(f2));
		if (f2 == 0 || f1 == f2) return f1;
		if (f1 == 0) return f2;
		let l1 = this.last(f1); let l2 = this.last(f2);
		this.next_[l1] = f2;
		this.prev_[f2] = l1;
		this.prev_[f1] = l2;
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
		this.prev_[i] = this.last(f);
		this.next_[p] = 0; this.prev_[f] = p;
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
	 *  note: property values are not considered
	 */
	equals(that, ...args) {
		that = super.equals(that, ...(args.length ? args :
								[this.n, this.nl, this.property(0)]));
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

		if (this.first_) {
			if (this.first_.length != that.first_.length)
				return false;
			for (let i = 1; i < this.first_.length; i++) {
				if (this.firstInList(i) != that.firstInList(i)) return false;
			}
		}
		return that;
	}

	/** Determine if two ListSets define the same sets.
	 *  @param that is a second ListSet or a string representing a
	 *  ListSet object
	 *  @return true if the two ListSet objects define identical sets;
	 */
	setEquals(that, ...args) {
		that = super.equals(that, ...(args.length ? args :
								[this.n, this.nl, this.property(0)]));
		if (typeof that == 'boolean') return that;

		let l = new List(this.n);
		for (let i = 1; i < this.n; i++) {
			if (!this.isfirst(i)) continue
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

	prop2string(i) {
		let p = this.prop_values[0][i];
		if (typeof p == 'string') return '"' + p + '"';
		if (typeof p == 'object') return JSON.stringify(p);
		return ''+p;
	}
	
	/** Produce a string representation of the object.
	 *  @param fmt is a pair of format bits that controls presentation
	 *     01 causes lists to be shown on separate lines
	 *     10 causes singletons to be shown explictly
	 *  @param label is a function used to label list items
	 *  @param listLabel is a function used to append a label to a list
	 *  @return a string such as "{[a c] [d b g]}".
	 */
	toString(fmt=0, label, listLabel=0) {
		if (!listLabel) listLabel = (l=>'');
		let anon = new Int8Array(this.n+1).fill(1);
		let s = '';
		if (this.first_) {
			// show numbered lists first
			for (let l = 1; l < this.first_.length; l++) {
				if (!this.firstInList(l)) continue;
				anon[this.firstInList(l)] = 0;
				if (!(fmt&1) && s.length) s += ' ';
				s += l + '[';
				for (let i = this.firstInList(l); i; i = this.next(i)) {
					if (i != this.firstInList(l)) s += ' ';
					s += this.x2s(i,label);
				}
				s += ']' + listLabel(l);
				s += (fmt&0x1 ? '\n' : '');
			}
		}
		// show anonymous lists
		let hasProps = (this.property(0)[0]);
		for (let l = 1; l <= this.n; l++) {
			if (!this.isfirst(l) || !anon[l]) continue;
			if (this.singleton(l) && !(fmt&0x2) && !hasProps)
				continue;
			if (!(fmt&1) && s.length) s += ' ';
			let showBrackets =  listLabel(l) || !this.singleton(l);
			if (showBrackets) s += '[';
			for (let i = l; i; i = this.next(i)) {
				if (i != l) s += ' ';
				s += this.x2s(i,label);
			}
			if (showBrackets) s += ']' + listLabel(l);
			s += (fmt&0x1 ? '\n' : '');
		}
		return (fmt&0x1 ? `{\n${s}}\n` : `{${s}}`);
	}

	/** Construct a new ListSet from a string representation.
	 *  @param s is a string, such as produced by toString().
	 *  @param src is a source object used to provide parameters needed
	 *  to construct new ListSet object
	 *  @param scan4prop is an optional function that is used to scan
	 *  for a property value; it is called after each list item is
	 *  successfully scanned; its arguments are the list item and a
	 *  Scanner object; it returns true on success; note if user
	 *  supplies scan4prop, must also process its results; default
	 *  behavior stores scanned information as the object's property(0) values
	 *  @param scan4prefix is an optional function to scan for a string
	 *  preceding each list; called with a scanner argument; it returns true
	 *  on success; if not supplied, a default function scans for a list
	 *  number; if it is supplied, client must process scanned info
	 *  @param scan4suffix is an optional function used to scan for a
	 *  list suffix; it is called immediately after the list's
	 *  closing bracket; it's arguments are the index of the
	 *  first item in the list and a Scanner; it returns true on success
	 *  @return a new ListSet object on success, else null
	 */
	static fromString(s, n=10, nl=0, property=[],
						 scan4prop=0, scan4prefix=0, scan4suffix=0) {
		let propVals = []; let hasProps = 0; 
		let listNumber = 0; let firstInList = [];
		if (!scan4prop) {
			// by default, a ':' indicates a numerical property value is next
			scan4prop = (u,sc) => {
						if (!sc.verify(':',0)) return true;
						let p = sc.nextDatum();
						propVals[u] = p; hasProps = 1;
						return true;
					};
		}
		if (!scan4prefix) {
			scan4prefix = (sc) => {
						sc.skipspace();
						if (sc.verify(/\d+\[/,0,0)) {
							// we have a list number
							listNumber = sc.nextInt();
							nl = Math.max(nl,listNumber);
						}
						return true;
					};
		}
		let sc = new Scanner(s);
		if (!sc.verify('{')) return null;
		let lists = []; let items = new Set();
		while (!sc.verify('}')) {
			let l;
			listNumber = 0;   // default version of scan4prefix sets listNumber
			scan4prefix(sc);  // when a number appears before left bracket
			if (sc.verify('[',1,0)) {
				l = sc.nextIndexList('[',']', scan4prop);
				if (l == null) return null;
				if (listNumber) {
					// only get here when default scan4prefix is being used
					firstInList[listNumber] = (l.length>0 ? l[0] : 0);
				//	nl = Math.max(nl,listNumber);
				}
				if (l.length>0 && scan4suffix) {
					if (sc.verify(/\s*[\}\s]/,0,0) || scan4suffix(l[0],sc)) {}
					else return null;
				}
			} else {
				let x = sc.nextIndex(scan4prop);
				if (Number.isNaN(x) || x <= 0) return null;
				l = [x];
			}
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return null;
				items.add(i);
			}
			lists.push(l);
		}

		if (!property[0] && hasProps) property = ['value',0];
		let ls = new ListSet(n,nl,hasProps ? property : []);

		let [pname] = property;
		for (let i = 1; i <= ls.n; i++) {
			if (propVals[i] != undefined)
				ls[pname](i,propVals[i]);
		}

		for (let i = 1; i <= nl; i++) {
			if (firstInList[i] != undefined)
				ls.append(firstInList[i],i);
		}

		for (let l of lists) {
			for (let i of l) {
				ls.join(l[0], i);
			}
		}
		return ls;
	}
}
