SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/List.h ${IDIR}/Glist.h \
	 ${IDIR}/LlheapSet.h ${IDIR}/Partition.h 
OFILES = kruskal.o prim.o primF.o rrobin.o

${OFILES} : ${HFILES}
${LIBGA} : ${OFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${LIBGA}

${LIBGA}: ${OFILES} ${LIBS}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
