SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/stdinc.h ${IDIR}/Ssets.h ${IDIR}/Ssets_rbt.h \
	${IDIR}/Ssets_sat.h ${IDIR}/Map_bst.h ${IDIR}/Map_sat.h
	# omit for now ${IDIR}/DkSsets.h ${IDIR}/StairFunc.h
OFILES = Ssets.o Ssets_rbt.o Ssets_sat.o \
	 Map_bst.o Map_sat.o
	 #omit for now: DkSsets.o StairFunc.o 
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
