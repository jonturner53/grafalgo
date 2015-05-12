SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/GroupGraph.h ${IDIR}/List.h \
	 ${IDIR}/Dlist.h ${IDIR}/egColor.h ${IDIR}/egBasicLayers.h \
	 ${IDIR}/egThinLayers.h ${IDIR}/egMinColor.h ${IDIR}/egRecolor.h \
	 ${IDIR}/egFewColors.h
OFILES = egColor.o egBasicLayers.o egThinLayers.o egMinColor.o egRecolor.o \
	 egFewColors.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${XFILES}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
