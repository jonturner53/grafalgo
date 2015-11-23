SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph_d.h ${IDIR}/Util.h 
XFILES = testSpt testApsp timeSpt timeApsp badCaseDijkstra

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${LIBGA} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

testSpt: testSpt.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

testApsp: testApsp.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

timeSpt: timeSpt.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

timeApsp: timeApsp.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

badCaseDijkstra: badCaseDijkstra.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

clean:
	rm -f *.o ${XFILES}
