/** \file Hash.cpp
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#include "Hash.h"
  
namespace grafalgo {

const uint64_t Hash::A[] = {	0xe65ac2d3a96347c5, 0xa96347c5e65ac2d3,
				0x47c5e65ac2d3a963, 0x47c5e65ac2d3a963
			   };

/** Hash a signed 64 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::s64(const int64_t& key, int hf) {
	uint32_t hi = ((uint64_t) key >> 32) & 0xffffffff;
	uint32_t lo = (uint32_t) key;
	return chunk(hi,hf)^chunk(lo,hf+1);
}
/** Hash an unsigned 32 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::u32(const uint32_t& key, int hf) {
	return chunk(key,hf);
}

/** Hash an unsigned 64 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::u64(const uint64_t& key, int hf) {
	uint32_t hi = ((uint64_t) key >> 32) & 0xffffffff;
	uint32_t lo = (uint32_t) key;
	return chunk(hi,hf)^chunk(lo,hf+1);
}

/** Hash a pair of signed 32 bit values.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::s32s32(const Pair<int32_t,int32_t>& key, int hf) {
	return chunk(key.first,hf)^chunk(key.second,hf+1);
}

/** Hash pair containing a signed 32 bit value and an unsigned 64 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::s32u64(const Pair<int32_t,uint64_t>& key, int hf) {
	uint32_t hi = ((uint64_t) key.second >> 32) & 0xffffffff;
	uint32_t lo = (uint32_t) key.second;
	return chunk(key.first,hf)^chunk(hi,hf+1)^chunk(lo,hf+2);
}

/** Hash pair containing a signed 32 bit value and a signed 64 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::s32s64(const Pair<int32_t,int64_t>& key, int hf) {
	uint32_t hi = ((uint64_t) key.second >> 32) & 0xffffffff;
	uint32_t lo = (uint32_t) key.second;
	return chunk(key.first,hf)^chunk(hi,hf+1)^chunk(lo,hf+2);
}

/** Hash pair containing two unsigned 32 bit values.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::u32u32(const Pair<uint32_t,uint32_t>& key, int hf) {
	return chunk(key.first,hf)^chunk(key.second,hf+1);
}

/** Hash pair containing unsigned 32 bit value and an unsigned 16 bit value.
 *  @param key is the key input to the hash function
 *  @param hf is an integer in 0..1 that identifies one of two hash functions
 *  @return a 32 bit "random-looking" value, based on key
 */
uint32_t Hash::u32u16(const Pair<uint32_t,uint16_t>& key, int hf) {
	return chunk(key.first,hf)^chunk((uint32_t) key.second,hf+1);
}

/** Hash a string.
 *  @param key is the value to be hashed
 *  @param hf must be 0 or 1; it specifies one of two hash functions to
 *  be used in the hash computation
 *  @return an unsigned 32 bit value suitable for use by HashSet or HashMap
 */
uint32_t Hash::string(const std::string& key, int hf) {
	uint32_t z = 0;
	const char* p = key.data();
	int len = key.length();
	if (len < 4) {
		// fill z byte-by-byte, repeating if necessary
		int n = len;
		for (int i = 0; i < 4; i++) {
			z |= (*p << 8*i); p++; n--;
			if (n == 0) { p = key.data(); n = len; }
		}
		return z;
	} else if (len < 8) {
		return  chunk(*((uint32_t*) p),hf)^
			chunk(*((uint32_t*) (p+(len-4))),hf+1);
	} else {
		const uint64_t *p64 = (uint64_t*) key.data();
		int i = hf; int n = len;
		while (n >= 8) {
			z ^= u64(*p64++,i); i = ((i+1) & 0x3); n -= 8;
		}
		return z ^ u64(*((uint64_t*) (p+(len-8))),i&0x3);
	}
}

} // ends namespace grafalgo
