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

	prop_names;	     // prop_names[i] is name of the i-th property added
	prop_defaults;	 // prop_defaults[i] is default value of the i-th property
	prop_values;     // prop_values[i] is array of values for i-th property

	/** constructor
	 *  @param n is index range for the items that appear on the lists
	 *  @param nl is the number of "numbered lists" that are hosted
	 *  by the list set; if nl=0, all lists are "anonymous" and can only
	 *  be identified by their first item; when numbered lists are present
	 *  the method first(l) returns the first item in list l, allowing the
	 *  lists to be identified based on some client-specific handle
	 *  @param propName is an optional property name
	 *  @param propDefault is a default value for the new property
	 */
	constructor(n=10, nl=0, propName='', propDefault=0) {
		ae = assertEnabled();
		super(n);
		this.next_ = new Int32Array(this.n+1);
		this.prev_ = new Int32Array(this.n+1);
		this.first_ = (nl ? new Int32Array(nl+1) : null);
		// initialize to singleton lists
		this.next_.fill(0);
		for (let i = 0; i <= this.n; i++) this.prev_[i] = i;

		this.prop_names = []; this.prop_defaults = []; this.prop_values = [];
		if (arguments.length > 2)
			this.addProperty(propName, propDefault);
	}

	/** Add an item property.
	 *  @param propName is the name of the new property
	 *  @param propDefault is the default value of the new property
	 */
	addProperty(propName, propDefault) {
		assert(this[propName] == undefined,
			   'ListSet:addProperty: name clash for ' + propName);

		let newProp = new Float64Array(this.n+1).fill(propDefault);
		this.prop_names.push(propName);
		this.prop_defaults.push(propDefault);
		this.prop_values.push(newProp);
		let i = this.prop_names.length-1;

		Object.defineProperty(this, propName,
			{ value: 	function(x) {
							ae && assert(0 <= x && x <= this.n,
                     			`ListSet.${propName}: invalid argument: ${x}`);
							if (arguments.length > 1) {
								this.prop_values[i][x] = arguments[1];
							}
							return this.prop_values[i][x];
						}
			});
		Object.defineProperty(this, 'reset_' + propName,
			{ value: function() { this.prop_values[i].fill(propDefault); } });
	}

	/** Retrieve a property name and default value using index.
	 *  @param i is a non-negative integer identifying a property, in the
	 *  order the properties were added; so 0 is the first property added
	 *  @return pair [name,default] giving the name and default value of
	 *  the property, or null if there is no property i.
	 */
	property(i) {
		if (i >= this.prop_names.length) return null;
		return [this.prop_names[i], this.prop_defaults[i]];
	}

	/** Clear the data structure, moving all items into single node lists.
	*/
	clear() {
		for (let i = 1; i <= this.n; i++) {
			this.next_[i] = 0; this.prev_[i] = i;
		}
		if (!this.first_) return;
		for (let i = 0; i < this.first_.length; i++)
			this.first_[i] = 0;
	}

	first(l) {
		ae && assert(this.first_ && l < this.first_.length,
					 `${l} [${this.first_}] ${this.first_.length}`);
		return this.first_[l];
	}

	/** Add an item to the end of a numbered list.
	 *  @param i is a list item
	 *  @param l is a numbered list
	 */
	append(i,l) {
		ae && assert(this.first_ && l < this.first_.length &&
					 this.singleton(i));
		this.first_[l] = this.join(this.first_[l], i);
	}

	/** Add an item to the front of a numbered list.
	 *  @param i is a list item
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
		this.first_[l] = this.delete(i, this.first_[l]);
	}

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
	 *  @return the modified list
	 */
	rotate(f, i) {
		if (i == f) return i;
		this.next_[this.last(f)] = f;
		this.prev_[f] = this.prev_[f];
		this.next_[this.prev_[i]] = 0;
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
	 */
	equals(that) {
		that = super.equals(...(arguments.length==1 ?
								[that, this.n] : arguments));
		if (typeof that == 'boolean') return that;
		if (this.n != that.n) return false;

		for (let i = 1; i < this.n; i++) {
			if (this.isfirst(i) != that.isfirst(i)) return false;
			if (!this.isfirst(i)) continue;
			let j1 = i; let j2 = i;
			do {
				j1 = this.next(j1); j2 = that.next(j2);
				if (j1 != j2) return false;
			} while (j1 != 0);
		}

		// check that the first properties match
		let p1 = this.property(0); let p2 = that.property(0);
		if ((p1 == null) != (p2 == null)) return false;
		if (p1 && p1[0] != p2[0]) return false;
		let pname = p1 ? p1[0] : '';
		for (let i = 1; i <= this.n; i++) {
			if (pname && this[pname](i) != that[pname](i)) {
				return false;
			}
		}


		return that;
	}

	/** Determine if two ListSets define the same sets.
	 *  @param that is a second ListSet or a string representing a
	 *  ListSet object
	 *  @return true if the two ListSet objects define identical sets.
	 */
	setEquals(that) {
		that = super.equals(...(arguments.length==1 ? [that,this.n]:arguments));
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
	toString(fmt=0, label=0, listLabel=0) {
		if (!label) {
			let pi = this.property(0);
			let name; let def; if (pi) [name, def] = pi;
			label = (j => this.x2s(j) +
					 (pi && this[name](j) != def ?
					  ':' + this[name](j) : ''));
		}
		if (!listLabel) listLabel = (l=>'');
		let s = '';
		if (this.first_) {
			// show only numbered lists
			for (let l = 1; l < this.first_.length; l++) {
				if (!this.first(l)) continue;
				if (!(fmt&1) && s.length) s += ' ';
				s += l + '[';
				for (let i = this.first(l); i; i = this.next(i)) {
					if (i != this.first(l)) s += ' ';
					s += label(i);
				}
				s += ']' + listLabel(l);
				s += (fmt&0x1 ? '\n' : '');
			}
			return (fmt&0x1 ? `{\n${s}}\n` : `{${s}}`);
		}
		// show anonymous lists
		let hasProps = (this.property(0) != null);
		for (let l = 1; l <= this.n; l++) {
			if (!this.isfirst(l)) continue;
			if (this.singleton(l) && !(fmt&0x2) && !hasProps)
				continue;
			if (!(fmt&1) && s.length) s += ' ';
			let showBrackets =  listLabel(l) || !this.singleton(l);
			if (showBrackets) s += '[';
			for (let i = l; i; i = this.next(i)) {
				if (i != l) s += ' ';
				s += label(i);
			}
			if (showBrackets) s += ']' + listLabel(l);
			s += (fmt&0x1 ? '\n' : '');
		}
		return (fmt&0x1 ? `{\n${s}}\n` : `{${s}}`);
	}

	/** Initialize this from a string representation.
	 *  Handles only anonymous lists.
	 *  @param s is a string, such as produced by toString().
	 *  @param itemLabel is an optional function that is used to scan
	 *  for a property value; it is called after each list item is
	 *  successfully scanned; its arguments are the list item and a
	 *  Scanner object; it returns true on success
	 *  @param listLabel is an optional function used to scan for a
	 *  list label; it is called immediately after the list's
	 *  closing bracket; it's arguments are the index of the
	 *  first item in the list and a Scanner; it returns true on success
	 *  @param propName is a name for an optional item property
	 *  @param propDefault is default value of new item property
note, we're not scanning for list numbers (yet);
so when numbered lists are in use, the unit tests must compare
strings to strings, not objects to strings;

this is muddled; if client supplies parsing functions, he must
also handle the processing of the datum, which is different
than when we provide the function locally; ok if client just
wants to decorate the lists with info that is pertinent to it
but has no internal significance; that's consistent applications
of anonymous lists, but maybe not when we have numbered lists
as well
	 *  @return a new ListSet object on success, else null
	 */
	static fromString(s, n=10, nl=0, propName='value', propDefault=0,
					     itemLabel=0, listLabel=0) {
		let propVals = []; let hasProps = 0;
		if (!itemLabel) {
			itemLabel = (u,sc) => {
						if (!sc.verify(':',0)) return true;
						let p = sc.nextNumber();
						if (Number.isNaN(p)) return false;
						propVals[u] = p; hasProps = 1;
						return true;
					};
		}
		let sc = new Scanner(s);
		if (!sc.verify('{')) return null;
		let lists = []; let items = new Set();
		while (!sc.verify('}')) {
			let l;
			if (sc.verify('[',1,0)) {
				l = sc.nextIndexList('[',']', itemLabel);
				if (l == null) return null;
				if (l.length > 0 && listLabel && !sc.isspace() &&
					!sc.verify('}',1,0) && !listLabel(l[0],sc)) {
					return null;
				}
			} else {
				let x = sc.nextIndex(itemLabel);
				if (x == NaN || x <= 0) return null;
				l = [x];
			}
			for (let i of l) {
				n = Math.max(i, n);
				if (items.has(i)) return null;
				items.add(i);
			}
			lists.push(l);
		}
		let ls = new ListSet(n, nl);
		if (arguments.length > 3 || hasProps) {
			ls.addProperty(propName, propDefault);
		}
		let name;
		if (ls.property(0)) [name] = ls.property(0);
		for (let i = 1; i <= ls.n; i++) {
			if (propVals[i] != undefined)
				ls[name](i,propVals[i]);
		}

		for (let l of lists) {
			for (let i of l) {
				ls.join(l[0], i);
			}
		}
		return ls;
	}
}
