SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
AROOT = ../../..
IDIR = ${AROOT}/include
LIBS := ${AROOT}/lib/lib-ds.a ${AROOT}/lib/lib-util.a
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -I ${IDIR} -O2 -std=c++0x

XFILES = testBlockingQ1 testBlockingQ2 \
	testNonblockingQ testNonblockingQ11

.cpp.o:
	${CXX} ${CXXFLAGS} -pthread -c $<

all : ${XFILES}

testBlockingQ1 : testBlockingQ1.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testBlockingQ2 : testBlockingQ2.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testNonblockingQ : testNonblockingQ.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testNonblockingQ11 : testNonblockingQ11.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
