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
	 ${IDIR}/List.h ${IDIR}/augPath.h ${IDIR}/shortPath.h \
	 ${IDIR}/maxCap.h ${IDIR}/capScale.h ${IDIR}/prePush.h \
	 ${IDIR}/ppFifo.h ${IDIR}/ppHiLab.h ${IDIR}/minCapFlow.h

OFILES = augPath.o shortPath.o maxCap.o capScale.o dinic.o dinicDtrees.o \
	 prePush.o ppFifo.o ppHiLab.o minCapFlow.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBGA}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
