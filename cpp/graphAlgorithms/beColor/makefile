SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/beColor.h 
OFILES = beColor.o beGreedy.o beRepMatch.o beMaxDegMatch.o beAugPath.o \
	 beStrictSplit.o degBound.o matchBound.o flowBound.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
