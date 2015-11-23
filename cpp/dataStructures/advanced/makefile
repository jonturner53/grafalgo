SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/PathSet.h ${IDIR}/Djsets_lct.h
OFILES = PathSet.o Djsets_lct.o
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

PathSet.o : ${IDIR}/stdinc.h ${IDIR}/PathSet.h
Djsets_lct.o :  ${IDIR}/stdinc.h ${IDIR}/Djsets_lct.h

all:	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
