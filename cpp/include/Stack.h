/** \file Stack.h
 *
 *  @author Jon Turner
 *  @date 2014
 *  This is open source software licensed under the Apache 2.0 license.
 *  See http://www.apache.org/licenses/LICENSE-2.0 for details.
 */

#ifndef STACK_H
#define STACK_H

#include <sstream>
#include "stdinc.h"
#include "Adt.h"
#include "Util.h"

namespace grafalgo {

/** This class implements a simple stack.  */
template<class T> class Stack : public Adt {
public:		Stack(int=16);
		~Stack();

	void	reset();
	void	resize(int);

	bool	empty() const;
	bool	full() const;

	void	push(T);
	T	pop();	
	int	xferIn(Stack<T>&,int);
	int	xferOut(Stack<T>&,int);

	string	toString() const;
	string	toString(int) const;
	friend ostream& operator<<(ostream& os, const T& q) {
		return (os << q.toString());
	}
private:
	int	sp;			///< stack pointer
	T	*stak;			///< where values are stored
};

/** Constructor for Stack objects.
 *  @param n is the specified capacity of the stack
 */
template<class T>
inline Stack<T>::Stack(int n) : Adt(n) {
	stak = new T[n]; sp = 0;
}

/** Destructor for Stack objects. */
template<class T>
inline Stack<T>::~Stack() { delete [] stak; }

/** Reset the stack, discarding any contents.
 */
template<class T>
inline void Stack<T>::reset() { sp = 0; }

/** Resize the queue, discarding any contents.
 *  @param n is the new specified capacity of the stack
 */
template<class T>
inline void Stack<T>::resize(int n) {
	Adt::resize(n);
	delete [] stak; stak = new int[n];
	sp = 0;
}

/** Determine if stack is empty.
 *  @return true if the stack is empty, else false
 */
template<class T>
inline bool Stack<T>::empty() const { return sp == 0; }

/** Determine if stack is full.
 *  @return true if the stack is full, else false
 */
template<class T>
inline bool Stack<T>::full() const { return sp == n(); }

/** Add a value to the top of the stack.
 *  @param x is the value to be added.
 */
template<class T>
inline void Stack<T>::push(T x) {
	assert(0 <= sp && sp < n());
	stak[sp++] = x;
}

/** Transfer values from top of another stack.
 *  @param other is another stack
 *  @param cnt is the max number of values to add
 *  @param return the number of values actually added
 */
template<class T>
inline int Stack<T>::xferIn(Stack<T>& other, int cnt) {
	cnt = min(cnt, min(other.sp, n()-sp));
	if (cnt == 0) return 0;
	std::copy(&other.stak[other.sp-cnt], &other.stak[other.sp], &stak[sp]);
	sp += cnt; other.sp -= cnt;
	return cnt;
}

/** Remove and return top item in the stack.
 *  @return the top item in the stack; throw IllegalArgument exception
 *  if stack is empty
 */
template<class T>
inline T Stack<T>::pop() {
	assert(!empty());
	return stak[--sp];
}

/** Transfer values to the top of another stack.
 *  @param other is another stack
 *  @param cnt is the max number of values to transfer to other
 *  @param return the number of values actually transferred
 */
template<class T>
inline int Stack<T>::xferOut(Stack<T>& other, int cnt) {
	return other.xferIn(*this, cnt);
}

/** Produce a string representing the stack contents.
 *  @param return the string representing the stack
 */
template<class T>
inline string Stack<T>::toString() const {
	stringstream ss;
	ss << "[";
	for (int i = 0; i < sp;  i++) {
		ss << stak[i];
		if (i != sp-1) ss << ", ";
	}
	ss << "]";
	return ss.str();
}

/** Produce a string representing the stack contents.
 *  @param n is the max number of stack values to print;
 *  if n is less than the number of values on the stack,
 *  the top n values are printed
 *  @param return the string representing the stack
 */
template<class T>
inline string Stack<T>::toString(int n) const {
	stringstream ss;
	ss << "[";
	if (n < sp) ss << ".. ";
	for (int i = max(0,sp-n); i < sp;  i++) {
		ss << stak[i];
		if (i != sp-1) ss << ", ";
	}
	ss << "]";
	return ss.str();
}

} // ends namespace

#endif
