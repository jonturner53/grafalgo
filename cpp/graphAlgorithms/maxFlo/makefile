SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Flograph.h ${IDIR}/Dheap.h \
	 ${IDIR}/List.h ${IDIR}/augPath.h ${IDIR}/shortPath.h \
	 ${IDIR}/maxCap.h ${IDIR}/capScale.h ${IDIR}/prePush.h \
	 ${IDIR}/ppFifo.h ${IDIR}/ppHiLab.h

OFILES = augPath.o shortPath.o maxCap.o capScale.o dinic.o dinicDtrees.o \
	 prePush.o ppFifo.o ppHiLab.o badCase.o minFlow.o

${OFILES} : ${HFILES}

XFILES = maxFlo maxFloRep check genBadCase maxFloMin

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

maxFlo: maxFlo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

maxFloRep: maxFloRep.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

check: check.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

genBadCase: genBadCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

maxFloMin: maxFloMin.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
