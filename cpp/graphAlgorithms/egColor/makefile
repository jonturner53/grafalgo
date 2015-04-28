SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/GroupGraph.h ${IDIR}/List.h \
	 ${IDIR}/Dlist.h ${IDIR}/egColor.h ${IDIR}/layers0.h \
	 ${IDIR}/layers1.h ${IDIR}/layers2.h ${IDIR}/layers3.h \
	 ${IDIR}/greedy1.h ${IDIR}/greedy2.h ${IDIR}/greedy3.h ${IDIR}/cover.h
OFILES = egColor.o layers0.o layers1.o layers2.o layers3.o \
	 greedy1.o greedy2.o greedy3.o cover.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

egColor: egColor.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

layers1: layers1.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

layers2: layers2.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
