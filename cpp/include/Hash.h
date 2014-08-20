/** \file Hash.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef HASH_H
#define HASH_H

#include "stdinc.h"
#include "Hash.h"
#include "Pair.h"

using namespace std;

namespace grafalgo {

/** Collection of hash functions that can be used with HashSet and HashMap
 *  data structures. Users may also supply their own, but these can be used
 *  for some common cases.
 */
class Hash {
public:
	static uint32_t s32(const int32_t&, int);
	static uint32_t s64(const int64_t&, int);
	static uint32_t u32(const uint32_t&, int);
	static uint32_t u64(const uint64_t&, int);

	static uint32_t s32s32(const Pair<int32_t,int32_t>&, int);
	static uint32_t s32s16(const Pair<int32_t,int16_t>&, int);
	static uint32_t u32u32(const Pair<uint32_t,uint32_t>&, int);
	static uint32_t u32u16(const Pair<uint32_t,uint16_t>&, int);
	static uint32_t s32u64(const Pair<int32_t,uint64_t>&, int);
	static uint32_t s32s64(const Pair<int32_t,int64_t>&, int);

	static uint32_t string(const std::string&, int);
private:
	static uint32_t chunk(int32_t, int);
	static uint32_t chunk(uint32_t, int);
	const static uint64_t A[4];
};

/** Compute a 32 bit chunk of a hash function.
 *  This method is used to compute the public hash functions.
 *  @param x is a signed 32 bit component of the original key
 *  @param hf is an integer in 0..3 that identifies one of four constants
 *  used in the hash
 *  @return a 32 bit "random-looking" value, based on x
 */
inline uint32_t Hash::chunk(int32_t x, int hf) {
	return (uint32_t) ((((uint64_t) x) * A[hf]) >> 16);
}

/** Compute a 32 bit chunk of a hash function.
 *  This method is used to compute the public hash functions.
 *  @param x is an unsigned 32 bit component of the original key
 *  @param hf is an integer in 0..3 that identifies one of four constants
 *  used in the hash
 *  @return a 32 bit "random-looking" value, based on x
 */
inline uint32_t Hash::chunk(uint32_t x, int hf) {
	return (uint32_t) ((((uint64_t) x) * A[hf]) >> 16);
}

} // ends namespace

#endif
