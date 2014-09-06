/** \file NonblockingQ11.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef NONBLOCKING11_H
#define NONBLOCKING11_H

#include <chrono>
#include <thread>
#include <atomic>
#include "stdinc.h"
#include "Util.h"

using std::atomic;

namespace grafalgo {

/** This class implements a simple nonblocking queue for communication
 *  between a single writer thread and a single reader. It uses lock-free 
 *  synchronization.
 */
template<class T> class NonblockingQ11 {
public:		NonblockingQ11(int=4);
		~NonblockingQ11();

	void	reset();
	void	resize(int);

	bool	empty() const;
	bool	full() const;

	bool	enq(T);
	T	deq();	

	string	toString() const;
private:
	int	N;			///< max number of items in queue

	atomic<uint32_t> rp;		///< read pointer
	atomic<uint32_t> wp;		///< write pointer

	T	*buf;			///< where values are stored
};

/** Constructor for NonblockingQ11 objects.
 *  @param capacity is the specified capacity of the queue
 */
template<class T>
inline NonblockingQ11<T>::NonblockingQ11(int capacity) : N(capacity) {
	buf = new T[N];
	rp.store(0); wp.store(0); 
}

/** Destructor for NonblockingQ11 objects. */
template<class T>
inline NonblockingQ11<T>::~NonblockingQ11() { delete [] buf; }

/** Reset the queue, discarding any contents.
 *  This should only be used in contexts where there is a single writer,
 *  and only the writing thread should do it.
 */
template<class T>
inline void NonblockingQ11<T>::reset() {
	rp.store(0); wp.store(0); 
}

/** Resize the queue, discarding any contents.
 *  This should only before any threads are using the NonblockingQ11.
 *  @param capacity is the new specified capacity of the queue
 */
template<class T>
inline void NonblockingQ11<T>::resize(int capacity) {
	N = capacity; delete [] buf; buf = new int[N];
	rp.store(0); wp.store(0); 
}

/** Determine if queue is empty.
 *  @return true if the queue is empty, else false
 */
template<class T>
inline bool NonblockingQ11<T>::empty() const { return rp.load() == wp.load(); }

/** Determine if queue is full.
 *  @return true if the queue is full, else false
 */
template<class T>
inline bool NonblockingQ11<T>::full() const {
	return (wp.load()+1)%N == rp.load();
}


/** Add value to the end of the queue.
 *  The calling thread is blocked if the queue is full.
 *  @param i is the value to be added.
 *  @param return true on success, false on failure
 */
template<class T>
inline bool NonblockingQ11<T>::enq(T x) {
	if (full()) return false;
	buf[wp] = x;
	wp.store((wp+1)%N);
	return true;
}

/** Remove and return first item in the queue.
 *  The calling thread is blocked if the queue is empty.
 *  @return the next item in the queue
 */
template<class T>
inline T NonblockingQ11<T>::deq() {
	if (empty()) return false;
	int x = buf[rp];
	rp.store((rp+1)%N);
	return x;
}

template<class T>
inline string NonblockingQ11<T>::toString() const {
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
