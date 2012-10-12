BIN = ~/bin
IDIR = ../../include
LDIR = ../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
ARCH := $(shell getconf LONG_BIT)
CXXFLAGS_32 = -O2 -m32 -I ${IDIR}
CXXFLAGS_64 = -O2 -m64 -I ${IDIR}
CXXFLAGS = $(CXXFLAGS_$(ARCH)) 
#CXXFLAGS = -O2 -m64 -I ${IDIR}

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

bfs.o :        ${IDIR}/stdinc.h ${IDIR}/Wgraph.h ${IDIR}/UiList.h
toposort.o :   ${IDIR}/stdinc.h ${IDIR}/Wdigraph.h ${IDIR}/UiList.h
cgraph.o :     ${IDIR}/stdinc.h ${IDIR}/Graph.h
rgraph.o :     ${IDIR}/stdinc.h ${IDIR}/Graph.h
Nca.o :        ${IDIR}/stdinc.h ${IDIR}/Graph.h ${IDIR}/Partition.h \
		${IDIR}/Nca.h

all:	${LIBGA} cgraph bfs toposort rgraph test_nca
	cp bfs toposort rgraph ${BIN}

clean:
	rm -f *.o *.exe
	rm -f ${BIN}/bfs.exe ${BIN}/toposort.exe ${BIN}/rgraph.exe \
	test_nca.exe

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
