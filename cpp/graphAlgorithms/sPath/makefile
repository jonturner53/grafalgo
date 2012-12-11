SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/List.h \
	 ${IDIR}/Dheap.h
OFILES = dijkstra.o bfScan.o dijkstraAll.o floyd.o
XFILES = badCase spt sptRep allPairs allPairsRep check sptUpdate

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

spt: spt.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

sptRep: sptRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCase: badCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

allPairs: allPairs.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

allPairsRep: allPairsRep.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

sptUpdate: sptUpdate.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
