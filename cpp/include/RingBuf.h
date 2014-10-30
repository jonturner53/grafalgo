/** \file RingBuf.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef RINGBUF_H
#define RINGBUF_H

#include <sstream>
#include <chrono>
#include "stdinc.h"
#include "Adt.h"
#include "Util.h"

using std::atomic;

namespace grafalgo {

/** This class implements a simple ring buffer.  */
template<class T> class RingBuf : public Adt {
public:		RingBuf(int=4);
		~RingBuf();

	void	reset();
	void	resize(int);

	bool	empty() const;
	bool	full() const;

	bool	enq(T);
	T	deq();	
	int	enq(T*,int);
	int	deq(T*,int);

	string	toString() const;
	friend ostream& operator<<(ostream& os, const T& q) {
		return (os << q.toString());
	}
private:
	int	N;			///< max number of items in buf

	uint32_t rp;			///< read pointer
	uint32_t wp;			///< write pointer

	T	*buf;			///< where values are stored
};

/** Constructor for RingBuf objects.
 *  @param capacity is the specified capacity of the queue
 */
template<class T>
inline RingBuf<T>::RingBuf(int capacity) {
	N = capacity; buf = new T[N]; rp = wp = 0;
}

/** Destructor for RingBuf objects. */
template<class T>
inline RingBuf<T>::~RingBuf() { delete [] buf; }

/** Reset the queue, discarding any contents.
 *  This should only be used in contexts where there is a single writer,
 *  and only the writing thread should do it.
 */
template<class T>
inline void RingBuf<T>::reset() {
	rp = wp = 0;
}

/** Resize the queue, discarding any contents.
 *  This should only before any threads are using the RingBuf.
 *  @param capacity is the new specified capacity of the queue
 */
template<class T>
inline void RingBuf<T>::resize(int capacity) {
	N = capacity; delete [] buf; buf = new int[N];
	rp = wp = 0;
}

/** Determine if queue is empty.
 *  @return true if the queue is empty, else false
 */
template<class T>
inline bool RingBuf<T>::empty() const { return rp == wp; }

/** Determine if queue is full.
 *  @return true if the queue is full, else false
 */
template<class T>
inline bool RingBuf<T>::full() const {
	return (wp+1)%N == rp;
}

/** Add value to the end of the queue.
 *  @param x is the value to be added.
 *  @param return true on success, false on failure
 */
template<class T>
inline bool RingBuf<T>::enq(T x) {
	if ((wp+1)%N == rp) return false;
	buf[wp] = x; wp = (wp < N ? wp+1 : 0);
	return true;
}

/** Add a sequence of values to the end of the queue.
 *  @param xp is a pointer to the first value in an array of values
 *  @param cnt is the number of values to add
 *  @param return the number of values actually added
 */
template<class T>
inline int RingBuf<T>::enq(T *xp, int cnt) {
	int avail = (rp > wp ? (rp - wp) - 1 : (N - wp) + (rp - 1));
	cnt = min(cnt, avail);
	if (cnt == 0) return 0;
	if (rp > wp || rp == 0 || cnt < N - wp) {
		std::copy(xp,xp+cnt,&buf[wp]);
		wp += cnt;
	} else { // wp wraps around
		int c1 = N - wp; int c2 = cnt - c1;
		std::copy(xp,xp+c1,&buf[wp]);
		wp = 0;
		if (c2 > 0) {
			std::copy(xp+c1,xp+cnt,&buf[0]);
			wp = c2;
		}
	}
	return cnt;
}

/** Remove and return first item in the queue.
 *  Avoids examining wp whenever possible, by using previously saved value.
 *  Note that wpOld is only accessed by the reader.
 *  @return the next item in the queue, or 0 is if the queue is empty
 */
template<class T>
inline T RingBuf<T>::deq() {
	if (rp == wp) return 0;
	int x = buf[rp]; rp = (rp < N ? rp+1 : 0);
	return x;
}

/** Remove and return a sequence of values from the queue.
 *  @param xp is a pointer to the start of an array where values are to
 *  be dequeued
 *  @param cnt is the max number of values to be dequeued
 *  @return the number of values that were actually dequeued
 */
template<class T>
inline int RingBuf<T>::deq(T *xp, int cnt) {
	cnt = min(cnt,(wp >= rp ? wp - rp : (N - rp) + wp));
	if (cnt < N-rp) {
		std::copy(&buf[rp], &buf[rp+cnt], xp);
		rp += cnt;
	} else {
		int c1 = N-rp; int c2 = cnt - c1;
		std::copy(&buf[rp], &buf[N], xp);
		rp = 0;
		if (c2 > 0) {
			std::copy(&buf[0], &buf[c2], xp+c1);
			rp = c2;
		}
	}
	return cnt;
}

template<class T>
inline string RingBuf<T>::toString() const {
	stringstream ss;
	ss << "rp=" << rp << " wp=" << wp << ": ";
	for (int i = rp; i != wp;  i = (i+1)%N) {
		ss << buf[i] << " ";
	}
	ss << "\n";
	return ss.str();
}

} // ends namespace

#endif
