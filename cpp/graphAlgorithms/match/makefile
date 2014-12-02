SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/List.h \
	 ${IDIR}/RlistSet.h ${IDIR}/Partition.h ${IDIR}/hopcroftKarp.h \
	 ${IDIR}/hungarian.h ${IDIR}/edmondsGabow.h ${IDIR}/fastEdmondsGabow.h
OFILES = hopcroftKarp.o hungarian.o edmondsGabow.o fastEdmondsGabow.o \
	maxdMatch.o fastMaxdMatch.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
