SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Partition.h \
	 ${IDIR}/Nca.h
XFILES = testBfs testFindSplit testToposort testNca
OFILES = bfs.o toposort.o Nca.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${XFILES}

testBfs: testBfs.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

testFindSplit: testFindSplit.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

testToposort: testToposort.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

testNca: testNca.o ${LIBS} ${LIBGA} 
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
