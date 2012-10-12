/** @file StaircaseFunc.cpp
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */
#include "StaircaseFunc.h"

StaircaseFunc::StaircaseFunc(int n1) : n(n1) { 
	points = new DualKeyBsts(2*n+1); free = new UiList(2*n+1);
	points->setkey(0,0,1); // initialize function to zero for all x>=0
	for (int i = 2; i <= 2*n+1; i++) free->addLast(i);
} 

StaircaseFunc::~StaircaseFunc() { delete points; delete free; }

// Return the y value at a specified x coordinate
item StaircaseFunc::value(int x)  {
	assert (x >= 0);
	item v = points->access(x,points->find(1));
	return points->key2(v);
}

// Return the smallest y value that the function takes on in
// the range [lo,hi]
int StaircaseFunc::findmin(int lo, int hi) {
	assert(0 <= lo && lo <= hi);
	// your code here
	int min = BIGINT;
	setPair pairA;
	setPair pairB;
	
	//lowNode is largest node with key1 <= lo
	item lowNode = points->access(lo,points->find(1));
	//split at lowNode, stuff we want in pairA.s2
	pairA = points->split(lowNode, points->find(1));
	//if key1(lowNode) == lo, we should include it
	if(points->key1(lowNode) >= lo){ min = points->key2(lowNode);}

	//we have 3 trees now, pair.s1, lo, pair.s2	
	//within pair.s2, split at the largest node < hi
	item hiNode = points->access(hi, points->find(pairA.s2));
	pairB = points->split(hiNode, points->find(pairA.s2));
	//check if min is at hiNode (hiNode <= hi)
	if(points->key2(hiNode) < min){ min = points->key2(hiNode);}
	
	//last thing to check is min in pairB.s1
	if(points->min2(pairB.s1) < min){ min = points->min2(pairB.s1);}
	
	//resemble the parts...we got 5 trees now
	int hiPortion = points->join(pairB.s1, hiNode, pairB.s2);
	int whole = points->join(pairA.s1, lowNode, hiPortion);
	
	return min;
}

// Add diff to all values in the range lo,hi.
void StaircaseFunc::change(int lo, int hi, int diff) {
	assert(0 <= lo && lo <= hi);
	// when adding new points to the function, first select unused item
	// from free list and insert that point into points
	// after removing an item from points, put it back on free
	// note - never remove item #1 from the search tree
	setPair pairA;pairA.s1 = Null;pairA.s2 = Null;
	setPair pairB;pairB.s1 = Null;pairB.s2 = Null;
	
	//lowNode is largest node with key1 <= lo
	item lowNode = points->access(lo,points->find(1));
	//split at lowNode and hiNode, like findmin func
	pairA = points->split(lowNode, points->find(1));
	item hiNode = points->access(hi, points->find(pairA.s2));
	if(pairA.s2 != Null){
		pairB = points->split(hiNode, points->find(pairA.s2));
	}
	
	//handle edge cases
	item insertLo, insertHi;
	//if lo == lowNode, add diff to lowNode, don't insert
	if (lo == lowNode) {
		points->change2(diff, points->find(lowNode));
	} else {
		insertLo = free->first(); free->removeFirst();
		points->setkey(insertLo, lo, diff + points->key2(lowNode));
		if (points->find(pairA.s2) == Null){
			points->insert(insertLo, points->find(lowNode));
		} else {
			points->insert(insertLo, points->find(pairA.s2));
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
			points->setkey(insertHi, hi+1, diff + points->key2(hiNode));
		}
		if (points->find(pairB.s1 != Null)){
			points->insert(insertHi, points->find(pairB.s1));
		} else if (hiNode != Null){
			points->insert(insertHi, points->find(hiNode));
		} else {
			points->insert(insertHi, points->find(lowNode));
		}
	}

	//everything in pairB.s1 is within range, add diff to dmin
	if(pairB.s1 != Null){
		points->change2(diff, points->find(pairB.s1));
	}
	
	//resemble the parts...we got 5 trees now
	int hiPortion = Null;
	if(hiNode != Null){
		hiPortion = points->join(pairB.s1, hiNode, pairB.s2);
	}
	int whole = points->join(pairA.s1, lowNode, hiPortion);
}

string& StaircaseFunc::toString(string& s) const {
	stringstream ss;
	for (item i = 1; i != 0; i = points->next(i)) {
		ss << "(" << points->key1(i) << "," << points->key2(i) << ") ";
	}
	ss << "\n";
	s = ss.str();
	return s;
}
