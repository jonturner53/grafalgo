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
 *  in a bounded range 1..n, for some value of n.
 *
 *  The use of index values has a couple advantages over pointers.
 *  First, index values can serve as common "handles" for
 *  items in multiple data structures, eliminating the need to have
 *  explicit mappings to relate such items. As one example,
 *  in an algorithm that uses a graph and a separate list of vertices,
 *  both can use the same indexes to represent the vertices.
 *  Index values also make it trivial to have fast membership tests
 *  for index lists and similar data structures.
 */
class Adt {
public:
	static const int32_t MAXINDEX = 0x7fffffff;
	static const int32_t MAXPOSITION = 0x7fffffff;

	Adt(index size=26) : nn(size) {}
	virtual ~Adt() {}

	/** Get the maximum index value for the data structure
	 *  @return the largest allowed index value
	 */
	index	n() const { return nn; }

	/** Determine if a given index is valid.
	 *  @param[in] i is an integer
	 *  @return true if i lies within the allowed range of index values,
	 *  else false
	 */
	bool	valid(index i) const { return 1 <= i && i <= nn; }

	/** Resize a data structure (discarding its contents).
	 *  Derived classes required to implement this method
	 *  @param[in] size is the new maximum index value
	 */
	void resize(int size) { nn = size; }

	/** Expand a data structure (retaining its contents).
	 *  Derived classes required to implement this method
	 *  @param[in] size is the new maximum index value
	 */
	void expand(int size) { nn = size; }

	// input/output
	static bool readIndex(istream&, index&);
	string index2string(index) const;

	/** Create a string representation of the data structure.
	 *  Derived classes are required to implement this method.
 	 */
	virtual string toString() const = 0;


	/** Send string representation to an output stream.
	 *  @param[in] out is an output stream
	 *  @param[in] a is an object belonging to some derived class
	 *  @return the output stream
 	 */
	friend ostream& operator<<(ostream& out, const Adt& a) {
		return out << a.toString();
	}

protected:
	index	nn;	///< defines range of index values for stored items
};

} // ends namespace

#endif
