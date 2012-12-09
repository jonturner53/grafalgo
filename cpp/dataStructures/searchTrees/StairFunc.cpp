/** @file StairFunc.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "StairFunc.h"

namespace grafalgo {

/** Constructor for StairFunc class.
 *  @param size defines the index range for the constructed object.
 */
StairFunc::StairFunc(int size) : Adt(size) {
	makeSpace(size);
}

/** Destructor for StairFunc class. */
StairFunc::~StairFunc() { freeSpace(); }

/** Allocate and initialize space for StairFunc.
 *  @param size is number of index values to provide space for
 */
void StairFunc::makeSpace(int size) {
	try {
		points = new DkBstSet(2*size+1); free = new List(2*size+1);
	} catch (std::bad_alloc e) {
		stringstream ss;
		ss << "makeSpace:: insufficient space for "
		   << size << "index values";
		string s = ss.str();
		throw OutOfSpaceException(s);
	}
	nn = size; clear();
}

/** Free dynamic storage used by StairFunc. */
void StairFunc::freeSpace() { delete points; delete free; }

/** Reinitialize data structure, creating single node trees.
 *  The initial search tree is formed using a single node with
 *  both keys equal to zero.
 */
void StairFunc::clear() {
	points->clear(); free->clear();
	points->setkey(1,0,0); // initialize function to zero for all x>=0
	for (int i = 2; i <= 2*n()+1; i++) free->addLast(i);
}

/** Resize a StairFunc object, discarding old value.
 *  @param size is the size of the resized object.
 */
void StairFunc::resize(int size) {
	freeSpace();
	try { makeSpace(size); } catch(OutOfSpaceException e) {
		string s; s = "StairFunc::resize::" + e.toString(s);
		throw OutOfSpaceException(s);
	}
}

/** Expand the space available for this ojbect.
 *  Rebuilds old value in new space.
 *  @param size is the size of the expanded object.
 */
void StairFunc::expand(int size) {
	if (size <= n()) return;
	StairFunc old(this->n()); old.copyFrom(*this);
	resize(size); this->copyFrom(old);
}

/** Copy another object to this one.
 *  @param source is object to be copied to this one
 */
void StairFunc::copyFrom(const StairFunc& source) {
	if (&source == this) return;
	if (source.n() > n()) resize(source.n());
	else clear();

	points->copyFrom(*(source.points));
	free->copyFrom(*(source.free));
}

// Return the y value at a specified x coordinate
index StairFunc::value(int x)  {
	assert (x >= 0);
	index v = points->access(x,points->find(1));
	return points->key2(v);
}

// Return the smallest y value that the function takes on in
// the range [lo,hi]
int StairFunc::findmin(int lo, int hi) {
	assert(0 <= lo && lo <= hi);
	int min = Util::BIGINT32;
	BstSet::BstPair pairA(0,0); BstSet::BstPair pairB(0,0);
	
	//lowNode is largest node with key1 <= lo
	index lowNode = points->access(lo,points->find(1));
	//split at lowNode, stuff we want in pairA.t2
	pairA = points->split(lowNode, points->find(1));
	//if key1(lowNode) == lo, we should include it
	if(points->key1(lowNode) >= lo){ min = points->key2(lowNode);}

	//we have 3 trees now, pair.t1, lo, pair.t2	
	//within pair.t2, split at the largest node < hi
	index hiNode = points->access(hi, points->find(pairA.t2));
	pairB = points->split(hiNode, points->find(pairA.t2));
	//check if min is at hiNode (hiNode <= hi)
	if(points->key2(hiNode) < min){ min = points->key2(hiNode);}
	
	//last thing to check is min in pairB.t1
	if(points->min2(pairB.t1) < min){ min = points->min2(pairB.t1);}
	
	//reassemble the parts...we have 5 trees now
	int hiPortion = points->join(pairB.t1, hiNode, pairB.t2);
	points->join(pairA.t1, lowNode, hiPortion);
	
	return min;
}

// Add diff to all values in the range lo,hi.
void StairFunc::change(int lo, int hi, int diff) {
	assert(0 <= lo && lo <= hi);
	// when adding new points to the function, first select unused index
	// from free list and insert that point into points
	// after removing an index from points, put it back on free
	// note - never remove index #1 from the search tree
	BstSet::BstPair pairA(0,0); BstSet::BstPair pairB(0,0);
	
	//lowNode is largest node with key1 <= lo
	index lowNode = points->access(lo,points->find(1));
	//split at lowNode and hiNode, like findmin func
	pairA = points->split(lowNode, points->find(1));
	index hiNode = points->access(hi, points->find(pairA.t2));
	if(pairA.t2 != 0){
		pairB = points->split(hiNode, points->find(pairA.t2));
	}
	
	//handle edge cases
	index insertLo, insertHi;
	//if lo == lowNode, add diff to lowNode, don't insert
	if (lo == lowNode) {
		points->change2(diff, points->find(lowNode));
	} else {
		insertLo = free->first(); free->removeFirst();
		points->setkey(insertLo, lo, diff + points->key2(lowNode));
		if (points->find(pairA.t2) == 0){
			points->insert(insertLo, points->find(lowNode));
		} else {
			points->insert(insertLo, points->find(pairA.t2));
		}
	}
	//if hi == hiNode, add diff to hiNode, don't insert
	if (hi == hiNode) {
		points->change2(diff, points->find(hiNode));
	}else{
		insertHi = free->first(); free->removeFirst();
		if(hi>hiNode){//at rightmost of step func
			points->setkey(insertHi, hi+1, 0);
		} else {
			points->setkey(insertHi, hi+1,
				       diff + points->key2(hiNode));
		}
		if (points->find(pairB.t1 != 0)){
			points->insert(insertHi, points->find(pairB.t1));
		} else if (hiNode != 0){
			points->insert(insertHi, points->find(hiNode));
		} else {
			points->insert(insertHi, points->find(lowNode));
		}
	}

	//everything in pairB.t1 is within range, add diff to dmin
	if(pairB.t1 != 0){
		points->change2(diff, points->find(pairB.t1));
	}
	
	//resemble the parts...we got 5 trees now
	int hiPortion = 0;
	if(hiNode != 0){
		hiPortion = points->join(pairB.t1, hiNode, pairB.t2);
	}
	points->join(pairA.t1, lowNode, hiPortion);
}

string& StairFunc::toString(string& s) const {
	stringstream ss;
	for (index i = 1; i != 0; i = points->suc(i)) {
		ss << "(" << points->key1(i) << "," << points->key2(i) << ") ";
	}
	ss << "\n";
	s = ss.str();
	return s;
}

} // ends namespace
