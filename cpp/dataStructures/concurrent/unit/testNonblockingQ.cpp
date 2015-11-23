// usage:
//	testQueue_nb
//
// Simple test of Queue_nb data structure

#include <chrono>
#include <atomic>
#include <thread>
#include <mutex>
#include "Queue_nb.h"

using std::thread;
using std::mutex;
using std::atomic;
using std::unique_lock;

using namespace forest;

Queue_nb<int> q(4);

void f() {
	for (int i = 0; i < 3333333; i++) {
		int x;
		do {
			x = q.deq();
			if (x == 0) this_thread::yield();
		} while(x == 0);
		while (!q.enq(x)) { this_thread::yield(); }
	}
}

int main() {
	for (int i = 1; i <= 10; i++) q.enq(i);

	thread t[10];
	for (int i = 0; i < 3; i++) t[i] = thread(f);
	for (int i = 0; i < 3; i++) t[i].join();
}
