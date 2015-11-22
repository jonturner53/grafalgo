SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/List.h \
	 ${IDIR}/RlistSet.h ${IDIR}/Partition.h ${IDIR}/hopcroftKarp.h \
	 ${IDIR}/hungarian.h ${IDIR}/edmondsGabowCore.h ${IDIR}/edmondsGabow.h \
	 ${IDIR}/fastEdmondsGabow.h \
	${IDIR}/edmondsGMGbi.h ${IDIR}/dynamicMatch.h \
	${IDIR}/maxdMatch.h ${IDIR}/fastMaxdMatch.h ${IDIR}/vsetMatch.h
OFILES = flowMatch.o flowMatchWt.o hopcroftKarp.o hungarian.o \
	edmondsGabowCore.o edmondsGabow.o fastEdmondsGabow.o edmondsGMGbi.o \
	flowMatch.o flowMatchWt.o maxdMatch.o fastMaxdMatch.o vsetMatch.o \
	dynamicMatch.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
