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
	 ${IDIR}/RlistSet.h ${IDIR}/Partition.h ${IDIR}/altPath.h \
	 ${IDIR}/faltPath.h ${IDIR}/edmonds.h ${IDIR}/fastEdmonds.h
OFILES = flowMatch.o altPath.o faltPath.o edmonds.o fastEdmonds.o \
	maxdMatch.o fmaxdMatch.o
XFILES = match matchRep

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

match: match.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

matchRep: matchRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
