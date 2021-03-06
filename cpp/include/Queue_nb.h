/** \file Queue_nb.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef NONBLOCKING_H
#define NONBLOCKING_H

#include <sstream>
#include <chrono>
#include <thread>
#include <atomic>
#include "stdinc.h"
#include "Util.h"

using std::atomic;

namespace grafalgo {

/** This class implements a simple thread-safe queue for communication
 *  among threads. It uses a lock-free implementation for high performance.
 *  It a fixed size circular buffer with a read counter and a write counter.
 *  These can be used to read/write the buffer by taking the remainder
 *  modulo the queue size. We use unsigned 32 bit ints for the counters,
 *  this does allow a very small probability of failure when the counters
 *  overflow. Could make this issue really negligible by using 64 bit ints
 *  instead.
 */
template<class T> class Queue_nb {
public:		Queue_nb(int=4);
		~Queue_nb();

	void	reset();
	void	resize(int);

	bool	empty() const;
	bool	full() const;

	bool	enq(T);
	T	deq();	

	string	toString() const;
	friend	ostream& operator<<(ostream& os, const T& q) {
		os << q.toString(); return os;
	}
private:
	int	N;			///< max number of items in queue

	atomic<uint32_t> rc;		///< read counter
	atomic<uint32_t> wc;		///< write counter
	atomic<uint32_t> wcs;		///< write counter shadow

	T	*buf;			///< where values are stored
};

/** Constructor for Queue_nb objects.
 *  @param capacity is the specified capacity of the queue; the actual
 *  capacity is rounded up to the next power of 2.
 */
template<class T>
inline Queue_nb<T>::Queue_nb(int capacity) {
	for (N = 1; N < capacity; N <<= 1) {}
	buf = new T[N];
	rc.store(0); wc.store(0); wcs.store(0);
}

/** Destructor for Queue_nb objects. */
template<class T>
inline Queue_nb<T>::~Queue_nb() { delete [] buf; }

/** Reset the queue, discarding any contents.
 *  This should only be used in contexts where there is a single writer,
 *  and only the writing thread should do it.
 */
template<class T>
inline void Queue_nb<T>::reset() {
	rc.store(0); wc.store(0); wcs.store(0);
}

/** Resize the queue, discarding any contents.
 *  @param capacity is the specified capacity of the queue; the actual
 *  capacity is rounded up to the next power of 2
 *  This should only before any threads are using the Queue_nb.
 */
template<class T>
inline void Queue_nb<T>::resize(int capacity) {
	for (N = 1; N < capacity; N <<= 1) {}
	delete [] buf; buf = new int[N];
	rc.store(0); wc.store(0); wcs.store(0);
}

/** Determine if queue is empty.
 *  @return true if the queue is empty, else false
 */
template<class T>
inline bool Queue_nb<T>::empty() const { return rc.load() == wc.load(); }

/** Determine if queue is full.
 *  @return true if the queue is full, else false
 */
template<class T>
inline bool Queue_nb<T>::full() const {
	return wc.load() == rc.load()+N;
}


/** Add value to the end of the queue.
 *  The calling thread is blocked if the queue is full.
 *  @param x is the value to be added.
 */
template<class T>
inline bool Queue_nb<T>::enq(T x) {
	int cnt = 0;
	uint32_t wcc = wc.load();
	while (wcc < rc.load()+(N-1)) {
		if (wc.compare_exchange_weak(wcc,wcc+1)) {
			buf[wcc%N] = x; 
			// wait until wcs==wcc, then increment it
			uint32_t tmp = wcc;
			while (!wcs.compare_exchange_weak(tmp,wcc+1)) {
				tmp = wcc; // undoing c&x update to tmp
			}
			// now wcs has been incremented
			return true;
		}
		if (++cnt == 2) { // yield after two consecutive misfires
			std::this_thread::yield(); cnt = 0;
		}
	}
	return false;
}

/** Remove and return first item in the queue.
 *  The calling thread is blocked if the queue is empty.
 *  @return the next item in the queue
 */
template<class T>
inline T Queue_nb<T>::deq() {
	int cnt = 0;
	uint32_t rcc = rc.load();
	while (rcc != wcs.load()) {
		int x = buf[rcc%N];
		if (rc.compare_exchange_weak(rcc,rcc+1)) {
			return x;
		}
		if (++cnt == 2) { // yield after two consecutive misfires
			std::this_thread::yield(); cnt = 0;
		}
	}
	return 0;
}

template<class T>
inline string Queue_nb<T>::toString() const {
	stringstream ss;
	ss << "rc=" << rc.load() << " wc=" << wc.load() << ": ";
	for (int i = 0; i < N; i++) {
		ss << buf[i] << " ";
	}
	ss << "\n";
	return ss.str();
}

} // ends namespace

#endif
