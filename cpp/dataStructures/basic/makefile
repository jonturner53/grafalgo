SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/stdinc.h ${IDIR}/List.h ${IDIR}/Dlist.h \
	${IDIR}/ListSet.h ${IDIR}/ClistSet.h ${IDIR}/SetPair.h \
	${IDIR}/Partition.h ${IDIR}/RlistSet.h
OFILES = List.o Dlist.o ListSet.o ClistSet.o SetPair.o \
	Partition.o RlistSet.o
${OFILES} : ${HFILES}

.cpp.o : 
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean :
	make -C unit clean
	rm -f *.o
