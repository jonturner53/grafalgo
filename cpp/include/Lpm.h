// Header file for longest matching prefix data structure.
// This version just uses a list. Replace with something
// efficient when time permits.

#ifndef LONGESTMATCHPREFIX_H
#define LONGESTMATCHPREFIX_H

#include "stdinc.h"
#include "misc.h"

class LongestMatchPrefix {
public:		
		LongestMatchPrefix(int=100);
		~LongestMatchPrefix();
	int	lookup(ipa_t);		// return the next hop for given addr
	bool	insert(ipa_t,int,int);	// insert (prefix,next hop) pair
	void	remove(ipa_t,int);	// remove a pair
	void	print();		// print the set of pairs
private:
	int	N;			// max number of pairs
	int	n;			// current number of pairs

	struct nodeItem {		
	ipa_t	pref;			// ip address
	short	len;			// length of prefix (in bits)
	short	nexthop;		// associated nexthop value
	} *vec;				// vector of pairs
};

#endif
