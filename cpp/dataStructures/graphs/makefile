SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall 
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

HFILES = ${IDIR}/stdinc.h ${IDIR}/Adt.h ${IDIR}/ListPair.h ${IDIR}/ClistSet.h \
	 ${IDIR}/HashSet.h ${IDIR}/Graph.h ${IDIR}/Digraph.h \
	 ${IDIR}/Flograph.h ${IDIR}/Wflograph.h ${IDIR}/Mflograph.h 
OFILES = Graph.o Wgraph.o Digraph.o Wdigraph.o Flograph.o Wflograph.o \
	 Mflograph.o Rgraph.o
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${OFILES} 
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
