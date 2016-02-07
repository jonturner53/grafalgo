/** \file Pair.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef PAIR_H
#define PAIR_H

#include "Adt.h"

using namespace std;

namespace grafalgo {

/** Simple template to create a pair of objects.
 *  Includes toString method for displaying pair; requires that
 *  template types be "printable" using stringstream's output operator.
 */
template<class F, class S> class Pair : Adt {
public:
	F	first;
	S	second;

		Pair() {}
		Pair(const F& f, const S& s) : first(f), second(s) {}

	bool	operator==(const Pair<F,S>& other) const {
		return first == other.first && second == other.second;
	}
	bool	operator!=(const Pair<F,S>& other) const {
		return first != other.first || second != other.second;
	}
	string	toString() const {
		stringstream ss;
		ss << "(" << first << ", " << second << ")";
		return ss.str();
	}
	friend ostream& operator<<(ostream& out, const Pair<F,S>& p) {
                return out << p.toString();
        }
};

} // ends namespace

#endif
