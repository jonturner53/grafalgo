SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Partition.h \
	 ${IDIR}/Nca.h
XFILES = cgraph bfs toposort randGraph
OFILES = Rgraph.o Nca.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}
	cp bfs toposort randGraph ${BIN}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

bfs: bfs.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

toposort: toposort.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

test_nca: test_nca.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

cgraph: cgraph.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

randGraph: randGraph.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
