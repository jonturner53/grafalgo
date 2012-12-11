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
	 ${IDIR}/LlheapSet.h ${IDIR}/Partition.h 
OFILES = kruskal.o prim.o primF.o rrobin.o
XFILES:	mst mstRep check mstUpdate mstUpdate2

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

mst: mst.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstRep: mstRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstUpdate: mstUpdate.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

mstUpdate2: mstUpdate2.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
