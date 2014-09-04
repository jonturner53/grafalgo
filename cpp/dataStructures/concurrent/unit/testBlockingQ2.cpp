// usage:
//	testBlockingQ2
//
// Simple test of BlockingQ data structure

#include <chrono>
#include <atomic>
#include <thread>
#include <mutex>
#include "BlockingQ.h"

using std::thread;
using std::mutex;
using std::atomic;
using std::unique_lock;

using namespace forest;

BlockingQ<int> q(20);

void f() {
	for (int i = 0; i < 333333; i++) {
		int x;
		x = q.deq();
		q.enq(x);
	}
}

int main() {
	for (int i = 1; i <= 10; i++) q.enq(i);

	thread t[10];
	for (int i = 0; i < 3; i++) t[i] = thread(f);
	for (int i = 0; i < 3; i++) t[i].join();
}
