SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/stdinc.h ${IDIR}/List.h ${IDIR}/List_d.h \
	${IDIR}/ListSet.h ${IDIR}/Djsets_cl.h ${IDIR}/ListPair.h \
	${IDIR}/Djsets_flt.h ${IDIR}/Djsets_rl.h
OFILES = List.o List_d.o ListSet.o Djsets_cl.o ListPair.o \
	Djsets_flt.o Djsets_rl.o
${OFILES} : ${HFILES}

.cpp.o : 
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean :
	make -C unit clean
	rm -f *.o
