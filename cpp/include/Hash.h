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
	static uint32_t hash_32(const int32_t&, int);
	static uint32_t hash_64(const int64_t&, int);
	static uint32_t hash_32_32(const Pair<int32_t,int32_t>&, int);
	static uint32_t hash_32_16(const Pair<int32_t,int16_t>&, int);

	static uint32_t hash_u32(const uint32_t&, int);
	static uint32_t hash_u64(const uint64_t&, int);
	static uint32_t hash_u32_32(const Pair<uint32_t,uint32_t>&, int);
	static uint32_t hash_u32_16(const Pair<uint32_t,uint16_t>&, int);

	static uint32_t hash_string(const std::string&, int);
};

} // ends namespace

#endif
