/** \file Hash.cpp
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Hash.h"
  
namespace grafalgo {

/** Hash an signed 32 bit value.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_32(const int32_t& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key;
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash an signed 64 bit value.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_64(const int64_t& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key >> 32; z += (key & 0xffffffff);
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash a pair of 32 bit values.
 *  @param key1 is the first value to be hashed
 *  @param key2 is the second value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_32_32(const Pair<int32_t,int32_t>& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key.first; z += key.second;
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash a pair consisting of a 32 bit and a 16 bit value.
 *  @param key is the pair to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_32_16(const Pair<int32_t,int16_t>& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key.first; z += key.second;
	z += (((uint32_t) key.second) << 16);
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash an unsigned 32 bit value.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_u32(const uint32_t& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key;
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash an unsigned 64 bit value.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_u64(const uint64_t& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key >> 32; z += (key & 0xffffffff);
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash a pair of 32 bit values.
 *  @param key1 is the first value to be hashed
 *  @param key2 is the second value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_u32_32(const Pair<uint32_t,uint32_t>& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key.first; z += key.second;
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash a pair consisting of a 32 bit and a 16 bit value.
 *  @param key is the pair to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_u32_16(const Pair<uint32_t,uint16_t>& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = key.first; z += key.second;
	z += (((uint32_t) key.second) << 16);
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}

/** Hash a string.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::hash_string(const std::string& key, int hf) {
	const uint32_t A0 = 0xa96347c5;
	const uint32_t A1 = 0xe65ac2d3;

	uint64_t z = 0;
	const char* p = key.data();
	int n = key.length();
	while (n >= 8) {
		z += *((const uint64_t*) p);
		p += 8; n -= 8;
	}
	for (int i = 0; i < 8; i++) {
		z += (*p << 8*i); p++; n--;
		if (n == 0) { p = key.data(); n = key.length(); }
	}
	z = (z >> 32) + (z & 0xffffffff);
	z *= (hf == 0 ? A0 : A1);
	return ((uint32_t) (z >> 16));
}


} // ends namespace
