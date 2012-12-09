BIN = ~/bin
IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
#CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -I ${IDIR}

XFILES = cgraph bfs toposort rgraph test_nca

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

bfs.o :        ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/List.h
toposort.o :   ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/List.h
cgraph.o :     ${IDIR}/stdinc.h ${IDIR}/Graph.h
rgraph.o :     ${IDIR}/stdinc.h ${IDIR}/Graph.h
Nca.o :        ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Partition.h \
		${IDIR}/Nca.h

all:	${LIBGA} ${XFILES}
	cp bfs toposort rgraph ${BIN}

clean:
	rm -f *.o ${XFILES}

${LIBGA}:Nca.o
	ar -ru ${LIBGA} Nca.o

bfs: bfs.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

toposort: toposort.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

test_nca: test_nca.o ${LIBS} 
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

cgraph: cgraph.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

rgraph: rgraph.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@
