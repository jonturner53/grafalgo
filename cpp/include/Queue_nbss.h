/** \file Queue_nbss.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef QUEUE_NBSS_H
#define QUEUE_NBSS_H

#include <sstream>
#include <chrono>
#include <thread>
#include <atomic>
#include "stdinc.h"
#include "Adt.h"
#include "Util.h"

using std::atomic;

namespace grafalgo {

/** This class implements a simple nonblocking queue for communication
 *  between a single writer thread and a single reader. It uses atomic
 *  operations to perform lock-free synchronization.
 *  @param T is the type of the objects stored in the queue
 *  @param pad is an integer that represents the number of bytes of padding
 *  to use betweeen object components, in order to minimize false-sharing
 *  of cache lines by different threads;
 *  default value of 64 is suitable for 64 byte cache lines
 */
template<class T,int pad=64> class Queue_nbss : public Adt {
public:		Queue_nbss(int=4);
		~Queue_nbss();

	void	reset();
	void	resize(int);

	bool	empty() const;
	bool	full() const;

	bool	enq(T);
	T	deq();	

	string	toString() const;
	friend ostream& operator<<(ostream& os, const T& q) {
		return (os << q.toString());
	}
private:
	int	N;			///< max number of items in buf
	int	padT;			///< padding in terms of units of T

	atomic<uint32_t> rp;		///< read pointer
	uint32_t rpOld;			///< earlier value of rp
	T	pad1[pad];		///< push write ptr into next cache line
	atomic<uint32_t> wp;		///< write pointer
	uint32_t wpOld;			///< earlier value of wp
	T	pad2[pad];		///< and separate buf as well

	T	*buf;			///< where values are stored
};

/** Constructor for Queue_nbss objects.
 *  @param capacity is the specified capacity of the queue
 */
template<class T, int pad>
inline Queue_nbss<T,pad>::Queue_nbss(int capacity) {
	padT = 1+(pad-1)/sizeof(T);
	if (padT < 1) Util::fatal("padding must be greater than 0");
	N = capacity + padT;
	buf = new T[N];
	rp.store(0); wp.store(0); rpOld = rp; wpOld = wp;
}

/** Destructor for Queue_nbss objects. */
template<class T, int pad>
inline Queue_nbss<T,pad>::~Queue_nbss() { delete [] buf; }

/** Reset the queue, discarding any contents.
 *  This should only be used in contexts where there is a single writer,
 *  and only the writing thread should do it.
 */
template<class T, int pad>
inline void Queue_nbss<T,pad>::reset() {
	rp.store(0); wp.store(0); rpOld = rp; wpOld = wp;
}

/** Resize the queue, discarding any contents.
 *  This should only before any threads are using the Queue_nbss.
 *  @param capacity is the new specified capacity of the queue
 */
template<class T, int pad>
inline void Queue_nbss<T,pad>::resize(int capacity) {
	N = capacity + padT; delete [] buf; buf = new int[N];
	rp.store(0); wp.store(0); rpOld = rp; wpOld = wp;
}

/** Determine if queue is empty.
 *  @return true if the queue is empty, else false
 */
template<class T, int pad>
inline bool Queue_nbss<T,pad>::empty() const { return rp == wp; }

/** Determine if queue is full.
 *  @return true if the queue is full, else false
 */
template<class T, int pad>
inline bool Queue_nbss<T,pad>::full() const {
	return (wp+padT)%N == rp;
}

/** Add value to the end of the queue.
 *  @param i is the value to be added.
 *  @param return true on success, false on failure
 */
template<class T, int pad>
inline bool Queue_nbss<T,pad>::enq(T x) {
	if ((wp+padT)%N != rpOld) {
		buf[wp] = x; wp.store((wp+1)%N); return true;
	}
	rpOld = rp.load();
	if ((wp+padT)%N == rpOld) return false;
	buf[wp] = x; wp.store((wp+1)%N);
	return true;
}

/** Remove and return first item in the queue.
 *  Avoids examining wp whenever possible, by using previously saved value.
 *  Note that wpOld is only accessed by the reader.
 *  @return the next item in the queue, or 0 is if the queue is empty
 */
template<class T, int pad>
inline T Queue_nbss<T,pad>::deq() {
/*
	if (cache is not empty) return cache.deq();
	else {
		try to refill cache using wpOld
		if not able to, update wpOld, then try
		update rp
	}
*/
	if (rp != wpOld) {
		int x = buf[rp]; rp.store((rp+1)%N); return x;
	}
	wpOld = wp.load();
	if (rp == wpOld) return 0;
	int x = buf[rp]; rp.store((rp+1)%N);
	return x;
}

template<class T, int pad>
inline string Queue_nbss<T,pad>::toString() const {
	stringstream ss;
	int rpc = rp.load(); int wpc = wp.load();
	ss << "rp=" << rpc << " wp=" << wpc << ": ";
	for (int i = rpc; i != wpc;  i = (i+1)%N) {
		ss << buf[i] << " ";
	}
	ss << "\n";
	return ss.str();
}

} // ends namespace

#endif
