SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Partition.h \
	 ${IDIR}/Nca.h 
XFILES = randGraph toDot
OFILES = bfs.o toposort.o Nca.o findSplit.o toDot.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${LIBGA} ${XFILES}
	cp randGraph ${BIN}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

randGraph: randGraph.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

toDot: toDot.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBS} ${LIBGA} -o $@

clean:
	rm -f *.o ${XFILES}
