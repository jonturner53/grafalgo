/** @file Adt.h
 *
 *  @author Jon Turner
 *  @date 2011
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef ADT_H
#define ADT_H

#include "stdinc.h"
#include "Exceptions.h"
#include "Util.h"

using namespace std;

using std::string;

namespace grafalgo {

// these are just handy names for indicating the usage of arguments
typedef int32_t index;
typedef int32_t position;

/** The Adt class is a base class from which other data structures
 *  in grafalgo are derived.
 *
 *  The data structures in grafalgo are built using integer index values
 *  to refer to specific items (set elements, nodes in search trees,
 *  vertices in graphs). In this context, an index is a positive integer
 *  in a bounded range 1..N, for some value of N.
 *
 *  The use of index values has a couple advantages over pointers.
 *  First, index values can serve as common "names" for
 *  items in multiple data structures, eliminating the need to have
 *  explicit mappings to relate such items. As one example,
 *  when graph vertices are identified by indexes, we can maintain
 *  a separate array of application-specific vertex attributes,
 *  allowing us to conveniently associate such information without
 *  having to embed it in the graph (as we might using templates).
 *
 *  Index values also make it trivial to have fast membership tests
 *  for index lists and similar data structures.
 */
class Adt {
public:
	static const int32_t MAXINDEX = 0x7ffffff;
	static const int32_t MAXPOSITION = 0x7ffffff;

	Adt(index size=26) : nn(size) {}
	virtual ~Adt() {}

	index n() const { return nn; }

	// disallow copy, move constructors, assignments
//	Adt(Adt&) = delete;
//	Adt(Adt&&) = delete;
//	Adt& operator=(Adt&) = delete;
//	Adt& operator=(Adt&&) = delete;

	// derived classes must provide these methods
	void resize(int size) { nn = size; }
	void expand(int size) { nn = size; }

	// input/output
	static bool readIndex(istream&, index&);
	string index2string(index) const;
	virtual string toString() const = 0;
	friend ostream& operator<<(ostream& out, const Adt& a) {
		return out << a.toString();
	}

protected:
	index	nn;	///< defines range of index values for stored items
};

} // ends namespace

#endif
