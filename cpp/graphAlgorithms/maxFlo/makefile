SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall 
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	 ${IDIR}/List.h ${IDIR}/fordFulkerson.h ${IDIR}/ffShortPath.h \
	 ${IDIR}/ffMaxCap.h ${IDIR}/ffScale.h ${IDIR}/prePush.h \
	 ${IDIR}/ppFifo.h ${IDIR}/ppHiLab.h 

OFILES = fordFulkerson.o ffShortPath.o ffMaxCap.o ffScale.o \
	dinic.o dinicDtrees.o prePush.o ppFifo.o ppHiLab.o maxFloMin.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBGA}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
